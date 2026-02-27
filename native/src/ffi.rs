
use std::sync::{Arc, Mutex};
use crossbeam_channel::unbounded;
use crate::Engine;

static mut ENGINE: Option<Arc<Mutex<Engine>>> = None;

#[no_mangle]
pub extern "C" fn init_engine(model_path: *const i8, threads: i32) {
    let path = unsafe { std::ffi::CStr::from_ptr(model_path) }
        .to_str()
        .unwrap();

    // In a real mobile app, we handle error mapping back to JS here
    if let Ok(engine) = Engine::new(path, threads) {
        unsafe {
            ENGINE = Some(Arc::new(Mutex::new(engine)));
        }
    }
}

#[no_mangle]
pub extern "C" fn generate(prompt: *const i8, callback: extern "C" fn(*const i8)) {
    let prompt_str = unsafe { std::ffi::CStr::from_ptr(prompt) }
        .to_str()
        .unwrap()
        .to_string();

    let (tx, rx) = unbounded();

    // Spawn inference on a background thread to keep UI interactive
    std::thread::spawn(move || {
        unsafe {
            if let Some(engine) = &ENGINE {
                let mut engine_lock = engine.lock().unwrap();
                let _ = engine_lock.generate_stream(&prompt_str, tx);
            }
        }
    });

    // Collect tokens from the channel and fire the callback
    for token in rx.iter() {
        let cstr = std::ffi::CString::new(token).unwrap();
        callback(cstr.as_ptr());
    }
}
