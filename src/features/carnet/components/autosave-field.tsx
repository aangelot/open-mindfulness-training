import { useEffect, useRef, useState } from 'react';
import type { TextInputProps } from 'react-native';

import { TextField } from '@/ui';

const DELAY_MS = 600;

/**
 * Text field that saves itself: shortly after typing stops, on blur and when the
 * screen closes. Seeded once from `initial`: mount it only after the data loaded.
 */
export function AutosaveField({
  initial,
  onSave,
  ...rest
}: Omit<TextInputProps, 'value' | 'onChangeText' | 'onBlur'> & {
  label?: string;
  initial: string;
  onSave: (text: string) => void;
}) {
  const [text, setText] = useState(initial);
  const pending = useRef<{ text: string; timer: ReturnType<typeof setTimeout> } | null>(null);
  const save = useRef(onSave);
  useEffect(() => {
    save.current = onSave;
  }, [onSave]);

  const flush = () => {
    const p = pending.current;
    if (!p) return;
    clearTimeout(p.timer);
    pending.current = null;
    save.current(p.text);
  };

  // Flush on unmount (back navigation while typing).
  useEffect(() => () => flush(), []);

  const onChangeText = (value: string) => {
    setText(value);
    if (pending.current) clearTimeout(pending.current.timer);
    pending.current = { text: value, timer: setTimeout(flush, DELAY_MS) };
  };

  return <TextField {...rest} value={text} onChangeText={onChangeText} onBlur={flush} />;
}
