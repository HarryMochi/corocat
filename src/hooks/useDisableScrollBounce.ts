import { useEffect } from "react";
import styles from "./useDisableScrollBounce.module.css";

export default function useDisableScrollBounce() {
  useEffect(() => {
  
    document.body.classList.add(styles.no_scroll);
    return () => {
      document.body.classList.remove(styles.no_scroll);
    };
  }, []);
}