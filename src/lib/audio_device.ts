import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Headphones, Speaker, Bluetooth, Usb, Monitor, Volume2 } from "lucide-react";

export type OutputDevice = { name: string; form_factor: string };

export function device_icon(form_factor: string) {
  switch (form_factor) {
    case "headset":
    case "headphone": return Headphones;
    case "speaker": return Speaker;
    case "bluetooth": return Bluetooth;
    case "usb": return Usb;
    case "hdmi":
    case "monitor": return Monitor;
    default: return Volume2;
  }
}

export function use_output_device(): OutputDevice {
  const [dev, set] = useState<OutputDevice>({ name: "Speakers", form_factor: "" });

  useEffect(() => {
    let mounted = true;

    function detect() {
      invoke<[string, string]>("get_audio_device")
        .then(([name, form_factor]) => {
          const display = name.length > 30 ? name.slice(0, 29).trimEnd() + "…" : name;
          if (mounted) set({ name: display, form_factor });
        })
        .catch(() => {});
    }

    detect();
    const id = setInterval(detect, 5000);
    return () => { mounted = false; clearInterval(id); };
  }, []);

  return dev;
}
