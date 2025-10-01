'use client';

import { useEffect, useState } from 'react';

export default function TypingEffect({ words }: { words: string[] }) {
  const [index, setIndex] = useState(0);
  const [subIndex, setSubIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [text, setText] = useState('');

  useEffect(() => {
    if (isDeleting) {
      if (subIndex === 0) {
        setIsDeleting(false);
        setIndex((prev) => (prev + 1) % words.length);
      } else {
        setTimeout(() => setSubIndex((prev) => prev - 1), 100);
      }
    } else {
      if (subIndex === words[index].length) {
        setTimeout(() => setIsDeleting(true), 2000);
      } else {
        setTimeout(() => setSubIndex((prev) => prev + 1), 150);
      }
    }
  }, [subIndex, isDeleting, index, words]);

  useEffect(() => {
    setText(words[index].substring(0, subIndex));
  }, [subIndex, index, words]);

  return (
    <span className="relative">
        {text}
        <span className="animate-pulse">|</span>
    </span>
  );
}
