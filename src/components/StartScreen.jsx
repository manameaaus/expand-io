import React from "react";

const StartScreen = ({ onStart }) => {
  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "rgba(0,0,0,0.7)",
        color: "white",
        zIndex: 10,
      }}
    >
      <h1 style={{ fontSize: "48px", marginBottom: "20px" }}>Expand.io</h1>
      <p style={{ fontSize: "24px", marginBottom: "40px" }}>
        Capture territory and avoid your trail! Use WASD or Arrow Keys to move
      </p>
      <button
        onClick={onStart}
        style={{
          padding: "15px 30px",
          fontSize: "20px",
          backgroundColor: "#4CAF50",
          color: "white",
          border: "none",
          borderRadius: "5px",
          cursor: "pointer",
        }}
      >
        Start Game
      </button>
      <div style={{ marginTop: "30px", fontSize: "16px" }}>
        Controls: WASD or Arrow Keys
      </div>
    </div>
  );
};

export default StartScreen;
