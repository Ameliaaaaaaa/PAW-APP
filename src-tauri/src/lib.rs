use crate::avatar_processor::AvatarProcessor;
use std::sync::Arc;
use std::sync::Mutex;
use tauri::Manager;

mod avatar_processor;

#[tauri::command]
fn get_successful_posts(processor: tauri::State<'_, Arc<Mutex<AvatarProcessor>>>) -> Vec<String> {
    let processor = processor.lock().unwrap();

    processor.get_successful_posts()
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_sql::Builder::new().build())
        .plugin(tauri_plugin_log::Builder::new().build())
        .plugin(tauri_plugin_http::init())
        .plugin(tauri_plugin_store::Builder::new().build())
        .setup(|app| {
            let avatar_processor = Arc::new(Mutex::new(AvatarProcessor::new()));

            avatar_processor.lock().unwrap().watch_cache_directory();

            app.manage(avatar_processor);

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![get_successful_posts])
        .run(tauri::generate_context!())
        .expect("error while running application");
}