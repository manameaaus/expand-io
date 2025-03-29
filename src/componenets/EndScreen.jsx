import React from "react";

const EndScreen = ({ score, onRestart }) => {
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
      <h1 style={{ fontSize: "48px", marginBottom: "20px" }}>Game Over!</h1>
      <button
        onClick={onRestart}
        style={{
          padding: "15px 30px",
          fontSize: "20px",
          backgroundColor: "#f44336",
          color: "white",
          border: "none",
          borderRadius: "5px",
          cursor: "pointer",
        }}
      >
        Play Again
      </button>
    </div>
  );
};

export default EndScreen;
