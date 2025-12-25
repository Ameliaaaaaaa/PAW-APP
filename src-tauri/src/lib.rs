use vrc_log::{parse_avatar_ids, watch};
use vrc_log::provider::prelude::Paw;
use std::{thread, time::Duration};
use crossbeam::channel::unbounded;
use vrc_log::provider::Provider;
use tokio::sync::RwLock;
use std::sync::Arc;
use tauri::State;

type SharedAvatarStore = Arc<RwLock<Vec<String>>>;

struct TauriSettings(vrc_log::settings::Settings);

impl Default for TauriSettings {
    fn default() -> Self {
        Self(vrc_log::settings::Settings {
            clear_amplitude: true,
            attribution: vrc_log::settings::Attribution::Anonymous(
                vrc_log::discord::DEVELOPER_ID.to_string()
            ),
            providers: vec![vrc_log::provider::ProviderKind::PAW]
        })
    }
}

#[tauri::command]
async fn start_log_watcher(
    path: String,
    store: State<'_, SharedAvatarStore>
) -> Result<(), String> {
    let (tx, rx) = unbounded();

    let tx_thread = tx.clone();

    thread::spawn(move || {
        if let Ok(_watcher) = watch(tx_thread, path, 2000) {
            loop {
                thread::sleep(Duration::from_secs(60));
            }
        }
    });

    let settings = Arc::new(TauriSettings::default().0);
    let paw_settings = settings.clone();
    let store_clone = store.inner().clone();

    tokio::spawn(async move {
        let paw = Paw::new(&*paw_settings);

        while let Ok(path) = rx.recv() {
            let avatar_ids = parse_avatar_ids(&path, paw_settings.clear_amplitude);

            for avatar_id in avatar_ids {
                {
                    let mut store_write = store_clone.write().await;

                    store_write.push(avatar_id.clone());
                }

                if let Err(err) = paw.send_avatar_id(&avatar_id).await {
                    eprintln!("Failed to submit to PAW: {}", err);
                }
            }
        }
    });

    Ok(())
}

#[tauri::command]
async fn get_avatar_ids(store: State<'_, SharedAvatarStore>) -> Result<Vec<String>, String> {
    let store_read = store.inner().read().await;

    Ok(store_read.clone())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let avatar_store: SharedAvatarStore = Arc::new(RwLock::new(Vec::new()));

    tauri::Builder::default()
        .plugin(tauri_plugin_single_instance::init(|_app, _args, _cwd| {}))
        .manage(avatar_store)
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_rusqlite2::Builder::default().build())
        .plugin(tauri_plugin_log::Builder::new().build())
        .plugin(tauri_plugin_http::init())
        .plugin(tauri_plugin_store::Builder::new().build())
        .invoke_handler(tauri::generate_handler![start_log_watcher, get_avatar_ids])
        .run(tauri::generate_context!())
        .expect("error while running application");
}