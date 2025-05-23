"use client";
import { blake2b } from "blakejs";
import React, { useState, useEffect } from "react";
import styles from "./page.module.css";

const A_CHAR_CODE = 65; // 'A'

const Home = () => {
  const [text, setText] = useState("");
  const [ciphertext, setCiphertext] = useState("");
  const [pressedKey, setPressedKey] = useState(null);
  const [rotors, setRotors] = useState([]);

  // Input handlers
  const handleInput = (char) => setText((prev) => prev + char);
  const handleBackspace = () => setText((prev) => prev.slice(0, -1));
  const handleDelete = () => setText((prev) => prev.substring(1));

  // Keyboard handlers
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

  const handleKeyRelease = () => setPressedKey(null);

  // Prompt for valid name (lowercase a-z)
  const getValidName = () => {
    let name = "";
    while (true) {
      name = prompt("Enter your name (lowercase letters only):", "")?.trim() || "";
      if (/^[a-z]+$/.test(name)) break;
      alert("Only lowercase alphabetic characters (a–z) are allowed.");
    }
    return name;
  };

  // Prompt for valid date dd-mm-yyyy
  const getValidDate = () => {
    let date = "";
    while (true) {
      date = prompt("Enter date in dd-mm-yyyy format:", "")?.trim() || "";
      if (/^\d{2}-\d{2}-\d{4}$/.test(date)) break;
      alert("Date must be in dd-mm-yyyy format (e.g., 05-09-2025).");
    }
    return date.replace(/-/g, "");
  };

  // SHA-256 hash and get binary string
  const sha256Binary = async (message) => {
    const encoder = new TextEncoder();
    const data = encoder.encode(message);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    return Array.from(new Uint8Array(hashBuffer))
      .map((b) => b.toString(2).padStart(8, "0"))
      .join("");
  };

  // Create BCD mask from date string repeated 8 times per digit
  const getBCDMask = (dateStr) =>
    dateStr
      .split("")
      .map((digit) => parseInt(digit).toString(2).padStart(4, "0").repeat(8))
      .join("");

  // Bitwise OR of two binary strings
  const binaryOR = (a, b) =>
    a
      .split("")
      .map((bit, i) => (bit === "1" || b[i] === "1" ? "1" : "0"))
      .join("");

  // Convert binary string to Uint8Array
  const binaryToUint8Array = (binaryStr) => {
    const bytes = new Uint8Array(binaryStr.length / 8);
    for (let i = 0; i < bytes.length; i++) {
      bytes[i] = parseInt(binaryStr.slice(i * 8, i * 8 + 8), 2);
    }
    return bytes;
  };

  // Blake2b 64-bit output
  const blake2b64 = (dataBytes) => blake2b(dataBytes, null, 8);

  // Convert Uint8Array (8 bytes) to BigInt
  const uint8ArrayToBigInt = (bytes) => {
    let result = 0n;
    for (const b of bytes) {
      result = (result << 8n) + BigInt(b);
    }
    return result;
  };

  // Convert BigInt to 19-digit decimal string with leading zeros if needed
  const bigIntTo19DigitDecimal = (bigInt) => {
    let decStr = bigInt.toString(10);
    if (decStr.length > 19) decStr = decStr.slice(-19); // truncate if longer (unlikely)
    else decStr = decStr.padStart(19, "0");
    return decStr;
  };

  // Force MSB=1 if day is odd; else keep hash unchanged
  const forceMSBIfDayOdd = (bytes, dayStr) => {
    const day = parseInt(dayStr, 10);
    if (day % 2 === 1) {
      // Set MSB of first byte: 10000000 = 0x80
      const newBytes = new Uint8Array(bytes);
      newBytes[0] = newBytes[0] | 0x80;
      return newBytes;
    }
    return bytes;
  };

  // Parse rotors from 19-digit number string
  // NEW RULE:
  // Try to take next two digits if <= 25, else take one digit.
  const parseRotors = (numStr) => {
    const rotors = [];
    let i = 0;

    while (i < numStr.length) {
      if (i + 1 < numStr.length) {
        const twoDigits = parseInt(numStr.slice(i, i + 2), 10);
        if (twoDigits <= 25) {
          rotors.push(twoDigits);
          i += 2;
          continue;
        }
      }
      // fallback to one digit
      rotors.push(parseInt(numStr[i], 10));
      i++;
    }
    return rotors;
  };

  // Caesar shift a single uppercase char by shift (0-25)
  const caesarShift = (char, shift) => {
    if (char === " ") return " "; // space unchanged
    const code = char.charCodeAt(0);
    if (code < A_CHAR_CODE || code > A_CHAR_CODE + 25) return char;
    return String.fromCharCode(((code - A_CHAR_CODE + shift) % 26) + A_CHAR_CODE);
  };

  // Apply rotors to input text:
  // For each char, shift by rotors[i % rotors.length]
  // ROTORS ARE CONSTANT: no rotation or changing after each char
  const applyRotors = (input, rotors) => {
    let output = "";
    for (let i = 0; i < input.length; i++) {
      let currentChar = input[i];
      
      // Pass the character through each rotor in sequence
      for (let rotorIndex = 0; rotorIndex < rotors.length; rotorIndex++) {
        const shift = rotors[rotorIndex];
        currentChar = caesarShift(currentChar, shift);
      }
      
      output += currentChar;
    }
    return output;
  };

  useEffect(() => {
    const init = async () => {
      const name = getValidName();
      const date = getValidDate();

      // Calculate hash
      const nameHashBinary = await sha256Binary(name);
      const dateMask = getBCDMask(date);
      const combinedBinary = binaryOR(nameHashBinary, dateMask);
      let combinedBytes = binaryToUint8Array(combinedBinary);

      let hash64 = blake2b64(combinedBytes);

      // Force MSB if day odd
      const dayStr = date.slice(0, 2);
      hash64 = forceMSBIfDayOdd(hash64, dayStr);

      // Convert hash bytes to BigInt, then to 19-digit decimal string
      const hashBigInt = uint8ArrayToBigInt(hash64);
      const decimalStr = bigIntTo19DigitDecimal(hashBigInt);

      console.log("64-bit BLAKE2b hash (hex):", Array.from(hash64).map(b => b.toString(16).padStart(2, "0")).join(""));
      console.log("19-digit decimal number:", decimalStr);

      // Parse rotors from decimal string
      const rotorArray = parseRotors(decimalStr);
      console.log("Rotors:", rotorArray);
      setRotors(rotorArray);

      // Ciphertext updates when text changes, so encrypt initial empty text as well
      setCiphertext(applyRotors(text, rotorArray));
    };

    init();

    // Key event listeners
    window.addEventListener("keydown", handleKeyPress);
    window.addEventListener("keyup", handleKeyRelease);
    return () => {
      window.removeEventListener("keydown", handleKeyPress);
      window.removeEventListener("keyup", handleKeyRelease);
    };
  }, []);

  // Whenever text or rotors change, update ciphertext
  useEffect(() => {
    if (rotors.length > 0) {
      setCiphertext(applyRotors(text, rotors));
    }
  }, [text, rotors]);

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
            <div className={styles.scrollableText}>{ciphertext}</div>
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
