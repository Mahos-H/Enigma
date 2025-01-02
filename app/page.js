"use client"
import React, { useState, useEffect } from "react";
import styles from "./page.module.css"; // Import your CSS module

const Home = () => {
  const [text, setText] = useState("");
  const [pressedKey, setPressedKey] = useState(null);

  const handleInput = (char) => {
    setText((prev) => prev + char);
  };

  const handleBackspace = () => {
    setText((prev) => prev.slice(0, -1));
  };

  const handleDelete = () => {
    setText((prev) => prev.substring(1));
  };

  const handleKeyPress = (event) => {
    if (event.key === "Backspace") {
      setPressedKey("BACKSPACE");
      handleBackspace();
      event.preventDefault();
    } else if (event.key === "Delete") {
      setPressedKey("DELETE");
      handleDelete();
      event.preventDefault();
    } else if (/^[a-zA-Z ]$/.test(event.key)) {
      const char = event.key.toUpperCase();
      setPressedKey(char === " " ? "SPACE" : char);
      handleInput(char);
    }
  };

  const handleKeyRelease = () => {
    setPressedKey(null);
  };

  useEffect(() => {
    window.addEventListener("keydown", handleKeyPress);
    window.addEventListener("keyup", handleKeyRelease);

    return () => {
      window.removeEventListener("keydown", handleKeyPress);
      window.removeEventListener("keyup", handleKeyRelease);
    };
  }, []);
  // Importing the crypto module for hashing
const crypto = require("crypto");

// Function to generate a hashed value, concatenate, and derive a number
function generateSeedNumber() {
  // Get the current date in YYYY-MM-DD format
  const currentDate = new Date().toISOString().split("T")[0];
  
  // Secret key
  const secretKey = "ABCD12345";

  // Create the salt by hashing the date and key
  const hash = crypto.createHash("sha256");
  hash.update(currentDate + secretKey);
  const salt = hash.digest("hex"); // Hashed output as a hex string

  // Append salt to "date-key-salt"
  const seedString = `${currentDate}-${secretKey}-${salt}`;
  
  // Use the seed string to generate a pseudorandom number
  const seedHash = crypto.createHash("sha256");
  seedHash.update(seedString);
  const seedValue = seedHash.digest("hex");

  // Convert the hashed seed value to a number
  const randomNumber = parseInt(seedValue.substring(0, 15), 16); // Using first 15 characters

  return randomNumber;
}

// Call the function and log the output
console.log(generateSeedNumber());

  return (
    <div className={styles.container}>
      <h1 className={styles.header}>Cyberpunk Keyboard</h1>
      <div className={styles.textFieldContainer}>
        <div className={styles.textField}>
          <label className={styles.label}>Input Text</label>
          <div className={styles.input} contentEditable={false}>
            <div className={styles.scrollableText}>{text}</div>
          </div>
        </div>
        <div className={styles.textField}>
          <label className={styles.label}>Ciphertext</label>
          <div className={styles.input} contentEditable={false}>
            <div className={styles.scrollableText}>{text}</div>
          </div>
        </div>
      </div>

      <div className={styles.keyboard}>
        {[..."ABCDEFGHIJKLMNOPQRSTUVWXYZ "].map((char, index) => (
          <button
            key={index}
            className={`${styles.key} ${
              pressedKey === (char === " " ? "SPACE" : char) ? styles.pressedKey : ""
            } ${char === " " ? styles.spaceKey : ""}`}
            onClick={() => handleInput(char)}
          >
            {char === " " ? "SPACE" : char}
          </button>
        ))}
        <button
          className={`${styles.key} ${pressedKey === "BACKSPACE" ? styles.pressedKey : ""}`}
          onClick={handleBackspace}
        >
          BACKSPACE
        </button>
        <button
          className={`${styles.key} ${pressedKey === "DELETE" ? styles.pressedKey : ""}`}
          onClick={handleDelete}
        >
          DELETE
        </button>
      </div>
    </div>
  );
};

export default Home;
