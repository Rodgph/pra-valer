import React, { useState, useEffect } from "react";
import styles from "./Clock.module.css";

export const Clock: React.FC = () => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatDigit = (num: number) => num.toString().padStart(2, '0');

  return (
    <div className={styles.container}>
      <div className={styles.glow} />
      
      <div className={styles.time}>
        {formatDigit(time.getHours())}:{formatDigit(time.getMinutes())}
        <span className={styles.seconds}>{formatDigit(time.getSeconds())}</span>
      </div>
      
      <div className={styles.date}>
        {time.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase()}
      </div>

      <div className={styles.status}>
        SYSTEM_TIME // SYNC_ACTIVE
      </div>
    </div>
  );
};

export default Clock;
