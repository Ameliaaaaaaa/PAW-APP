use dirs::home_dir;
use notify::{Config, RecommendedWatcher, RecursiveMode, Watcher};
use regex::Regex;
use reqwest::Client;
use std::collections::VecDeque;
use std::fs;
use std::path::PathBuf;
use std::sync::mpsc;
use std::sync::{Arc, Mutex};
use std::time::Duration;
use tokio::runtime::Handle;

const BASE_URL: &str = "https://paw-api.amelia.fun/";

const MAX_CONCURRENT: usize = 3;

#[derive(Clone)]
pub struct AvatarProcessor {
    queue: Arc<Mutex<Vec<String>>>,
    is_processing: Arc<Mutex<bool>>,
    client: Client,
    successful_posts: Arc<Mutex<VecDeque<String>>>,
}

impl AvatarProcessor {
    pub fn new() -> Self {
        AvatarProcessor {
            queue: Arc::new(Mutex::new(Vec::new())),
            is_processing: Arc::new(Mutex::new(false)),
            client: Client::new(),
            successful_posts: Arc::new(Mutex::new(VecDeque::with_capacity(1000))),
        }
    }

    pub async fn process_avatar(&self, avatar_id: String) {
        let mut queue = self.queue.lock().unwrap();

        if !queue.contains(&avatar_id) {
            queue.push(avatar_id);
        }

        if !*self.is_processing.lock().unwrap() {
            let processing = self.is_processing.clone();

            *processing.lock().unwrap() = true;

            let processor = self.clone();

            tokio::spawn(async move {
                processor.process_avatars().await;

                *processing.lock().unwrap() = false;
            });
        }
    }

    async fn process_avatars(&self) {
        while !self.queue.lock().unwrap().is_empty() {
            let current_avatar_ids: Vec<String> = {
                let mut queue_lock = self.queue.lock().unwrap();
                let count = std::cmp::min(MAX_CONCURRENT, queue_lock.len());

                queue_lock.drain(0..count).collect()
            };

            let mut handles = vec![];

            for avatar_id in current_avatar_ids {
                let client = self.client.clone();
                let successful_posts = self.successful_posts.clone();

                let handle = tokio::spawn(async move {
                    let response = client
                        .post(format!("{}update?avatarId={}", BASE_URL, avatar_id))
                        .header("User-Agent", "PAW-APP/0.0.1")
                        .send()
                        .await;

                    match response {
                        Ok(resp) => {
                            let status = resp.status();
                            let _body = resp.text().await.unwrap_or_default();

                            if status.is_success() {
                                let mut successful_posts_lock = successful_posts.lock().unwrap();

                                if !successful_posts_lock.contains(&avatar_id) {
                                    successful_posts_lock.push_back(avatar_id.clone());

                                    if successful_posts_lock.len() > 1000 {
                                        successful_posts_lock.pop_front();
                                    }
                                }

                                true
                            } else {
                                false
                            }
                        }
                        Err(err) => {
                            println!("Error processing avatar: {} - {}", avatar_id, err);
                            false
                        }
                    }
                });

                handles.push(handle);
            }

            for handle in handles {
                let _ = handle.await;
            }
        }
    }

    pub fn get_successful_posts(&self) -> Vec<String> {
        let successful_posts_lock = self.successful_posts.lock().unwrap();

        successful_posts_lock.clone().into_iter().collect()
    }

    pub fn watch_cache_directory(&self) {
        let vrchat_cache_path = if let Some(home) = home_dir() {
            home.join("AppData/LocalLow/VRChat/VRChat/Cache-WindowsPlayer")
        } else {
            println!("Could not determine home directory. Using relative path.");
            PathBuf::from("AppData/LocalLow/VRChat/VRChat/Cache-WindowsPlayer")
        };

        println!("Watching VRChat cache directory: {:?}", vrchat_cache_path);

        if !vrchat_cache_path.exists() {
            println!(
                "Warning: VRChat cache directory does not exist: {:?}",
                vrchat_cache_path
            );
        }

        let (sender, receiver) = mpsc::channel::<PathBuf>();

        let _rt_handle = match Handle::try_current() {
            Ok(handle) => {
                println!("Successfully captured Tokio runtime handle");
                Some(handle)
            }
            Err(_) => {
                println!("No Tokio runtime found in current thread. Events will be processed synchronously.");
                None
            }
        };

        let avatar_regex = Regex::new(
            r"avtr_[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}",
        )
        .unwrap();

        let processor = self.clone();
        let regex = avatar_regex.clone();

        std::thread::spawn(move || {
            let rt = tokio::runtime::Runtime::new().expect("Failed to create Tokio runtime");

            rt.block_on(async {
                while let Ok(data_path) = receiver.recv() {
                    if data_path.exists() {
                        match fs::read(&data_path) {
                            Ok(content) => {
                                if let Some(captures) =
                                    regex.captures(&String::from_utf8_lossy(&content))
                                {
                                    if let Some(avatar_id) = captures.get(0) {
                                        let avatar_id_str = avatar_id.as_str().to_string();

                                        processor.process_avatar(avatar_id_str).await;
                                    }
                                }
                            }
                            Err(e) => println!("Error reading file {:?}: {}", data_path, e),
                        }
                    }
                }
            });
        });

        let config = Config::default().with_poll_interval(Duration::from_secs(1));

        let sender_clone = sender.clone();

        let mut watcher = RecommendedWatcher::new(
            move |res: Result<notify::Event, notify::Error>| match res {
                Ok(event) => {
                    if matches!(
                        event.kind,
                        notify::EventKind::Modify(_) | notify::EventKind::Create(_)
                    ) {
                        for path_buf in &event.paths {
                            if let Some(file_name) = path_buf.file_name() {
                                if let Some(file_name_str) = file_name.to_str() {
                                    if file_name_str.ends_with("__info") {
                                        let data_path = path_buf.with_file_name(
                                            file_name_str.replace("__info", "__data"),
                                        );

                                        if let Err(e) = sender_clone.send(data_path) {
                                            println!(
                                                "Error sending path to processing thread: {}",
                                                e
                                            );
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
                Err(e) => println!("Watch error: {:?}", e),
            },
            config,
        )
        .unwrap();

        match watcher.watch(&vrchat_cache_path, RecursiveMode::Recursive) {
            Ok(_) => println!("Successfully watching VRChat cache directory"),
            Err(e) => println!("Failed to watch VRChat cache directory: {}", e),
        };

        std::mem::forget(watcher);
    }
}