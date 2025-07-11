#[cfg(windows)]
use std::{mem, ptr};
#[cfg(windows)]
use winapi::shared::windef::HWND;
#[cfg(windows)]
use winapi::um::winuser::{
    CloseClipboard, EmptyClipboard, FindWindowA, OpenClipboard, SendInput, SetClipboardData,
    SetForegroundWindow, CF_TEXT, INPUT, INPUT_KEYBOARD, KEYBDINPUT, KEYEVENTF_KEYUP, VK_CONTROL,
    VK_ESCAPE, VK_MENU, VK_RETURN, VK_TAB, VK_UP,
};

#[cfg(windows)]
fn create_keyboard_input(key: u16, flags: u32) -> INPUT {
    let mut input = INPUT {
        type_: INPUT_KEYBOARD,
        u: unsafe { mem::zeroed() },
    };
    let k = KEYBDINPUT {
        wVk: key,
        wScan: 0,
        dwFlags: flags,
        time: 0,
        dwExtraInfo: 0,
    };
    unsafe {
        *input.u.ki_mut() = k;
    }
    input
}

#[cfg(windows)]
fn set_clipboard_text(text: &str) -> bool {
    unsafe {
        if OpenClipboard(ptr::null_mut() as HWND) == 0 {
            return false;
        }
        EmptyClipboard();
        let text_bytes = text.as_bytes();
        let handle = winapi::um::winbase::GlobalAlloc(
            winapi::um::winbase::GMEM_MOVEABLE,
            text_bytes.len() + 1,
        );
        if handle.is_null() {
            CloseClipboard();
            return false;
        }
        let locked_mem = winapi::um::winbase::GlobalLock(handle) as *mut u8;
        if !locked_mem.is_null() {
            ptr::copy_nonoverlapping(text_bytes.as_ptr(), locked_mem, text_bytes.len());
            *locked_mem.add(text_bytes.len()) = 0;
            winapi::um::winbase::GlobalUnlock(handle);
        }
        SetClipboardData(CF_TEXT, handle);
        CloseClipboard();
        true
    }
}

#[cfg(windows)]
fn send_chat_command(text: &str, tab_back: bool) {
    if !set_clipboard_text(text) {
        println!("Failed to set clipboard text");
        return;
    }
    let mut inputs = Vec::new();

    // enter (open chat)
    inputs.push(create_keyboard_input(VK_RETURN.try_into().unwrap(), 0));
    inputs.push(create_keyboard_input(
        VK_RETURN.try_into().unwrap(),
        KEYEVENTF_KEYUP,
    ));

    // press ctrl
    inputs.push(create_keyboard_input(VK_CONTROL.try_into().unwrap(), 0));

    // press a (highlight existing text)
    inputs.push(create_keyboard_input(0x41, 0));
    inputs.push(create_keyboard_input(0x56, KEYEVENTF_KEYUP));

    // press v (paste)
    inputs.push(create_keyboard_input(0x56, 0));
    inputs.push(create_keyboard_input(0x56, KEYEVENTF_KEYUP));

    // release ctrl
    inputs.push(create_keyboard_input(
        VK_CONTROL.try_into().unwrap(),
        KEYEVENTF_KEYUP,
    ));

    // enter (send command)
    inputs.push(create_keyboard_input(VK_RETURN.try_into().unwrap(), 0));
    inputs.push(create_keyboard_input(
        VK_RETURN.try_into().unwrap(),
        KEYEVENTF_KEYUP,
    ));

    // restore the last chat state (enter, up, up, esc)
    inputs.push(create_keyboard_input(VK_RETURN.try_into().unwrap(), 0));
    inputs.push(create_keyboard_input(
        VK_RETURN.try_into().unwrap(),
        KEYEVENTF_KEYUP,
    ));
    inputs.push(create_keyboard_input(VK_UP.try_into().unwrap(), 0));
    inputs.push(create_keyboard_input(
        VK_UP.try_into().unwrap(),
        KEYEVENTF_KEYUP,
    ));
    inputs.push(create_keyboard_input(VK_UP.try_into().unwrap(), 0));
    inputs.push(create_keyboard_input(
        VK_UP.try_into().unwrap(),
        KEYEVENTF_KEYUP,
    ));
    inputs.push(create_keyboard_input(VK_ESCAPE.try_into().unwrap(), 0));
    inputs.push(create_keyboard_input(
        VK_ESCAPE.try_into().unwrap(),
        KEYEVENTF_KEYUP,
    ));

    // tab back to last pane
    if tab_back {
        inputs.push(create_keyboard_input(VK_MENU.try_into().unwrap(), 0));
        inputs.push(create_keyboard_input(VK_TAB.try_into().unwrap(), 0));
        inputs.push(create_keyboard_input(
            VK_TAB.try_into().unwrap(),
            KEYEVENTF_KEYUP,
        ));
        inputs.push(create_keyboard_input(
            VK_MENU.try_into().unwrap(),
            KEYEVENTF_KEYUP,
        ));
    }

    unsafe {
        SendInput(
            inputs.len() as u32,
            inputs.as_mut_ptr(),
            mem::size_of::<INPUT>() as i32,
        );
    }
}

#[tauri::command]
pub fn reload(version: &str) -> String {
    #[cfg(windows)]
    unsafe {
        let window_name = "Path of Exile 2\0".as_ptr() as *const i8; // TODO: make this configurable
        let hwnd = FindWindowA(ptr::null(), window_name);
        if !hwnd.is_null() {
            SetForegroundWindow(hwnd);
            std::thread::sleep(std::time::Duration::from_millis(100));
            send_chat_command("/reloaditemfilter", false); // and this
        }
    }
    return "".to_string();
}
