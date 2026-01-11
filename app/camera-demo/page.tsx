"use client";

import { useEffect, useState, useRef } from "react";
import {
  Play,
  Pause,
  RotateCcw,
  Rewind,
  FastForward,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

const BASE_URL = "https://511on.ca/map/Cctv";

// Magnitude options - testing different increments to find capture frequency
const MAGNITUDES = [
  { label: "1st digit (1B)", value: 1000000000 },
  { label: "2nd digit (100M)", value: 100000000 },
  { label: "3rd digit (10M)", value: 10000000 },
  { label: "4th digit (1M)", value: 1000000 },
  { label: "5th digit (100K)", value: 100000 },
  { label: "6th digit (10K)", value: 10000 },
  { label: "7th digit (1K)", value: 1000 },
  { label: "8th digit (100)", value: 100 },
  { label: "9th digit (10)", value: 10 },
  { label: "10th digit (1)", value: 1 },
];

export default function CameraDemoPage() {
  const [cameraId, setCameraId] = useState("1438");
  const [initialTimestamp, setInitialTimestamp] = useState(1768084420);
  const [timestamp, setTimestamp] = useState(initialTimestamp);
  const [isPlaying, setIsPlaying] = useState(false);
  const [frameRate, setFrameRate] = useState(2); // frames per second
  const [direction, setDirection] = useState<"forward" | "backward">("forward");
  const [magnitudeIndex, setMagnitudeIndex] = useState(5); // Start with 10K increment
  const [customIncrement, setCustomIncrement] = useState(10000);
  const [useCustomIncrement, setUseCustomIncrement] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const currentIncrement = useCustomIncrement
    ? customIncrement
    : MAGNITUDES[magnitudeIndex]?.value || 10000;

  // Get current URL with timestamp
  const currentUrl = `${BASE_URL}/${cameraId}?t=${timestamp}`;

  // Update timestamp when initial timestamp changes
  useEffect(() => {
    setTimestamp(initialTimestamp);
  }, [initialTimestamp]);

  // Handle play/pause
  useEffect(() => {
    if (isPlaying) {
      intervalRef.current = setInterval(() => {
        setTimestamp((prev) => {
          const increment =
            direction === "forward" ? currentIncrement : -currentIncrement;
          return prev + increment;
        });
      }, 1000 / frameRate); // Update every (1/frameRate) seconds
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isPlaying, frameRate, direction, currentIncrement]);

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const handleReset = () => {
    setIsPlaying(false);
    setTimestamp(initialTimestamp);
  };

  const handleFrameRateChange = (rate: number) => {
    setFrameRate(rate);
  };

  const handleStep = (forward: boolean) => {
    const increment = forward ? currentIncrement : -currentIncrement;
    setTimestamp((prev) => prev + increment);
  };

  // Format timestamp for display
  const formatTimestamp = (ts: number) => {
    const date = new Date(ts * 1000);
    return date.toLocaleString();
  };

  // Format increment for display
  const formatIncrement = (inc: number) => {
    if (inc >= 1000000) return `${inc / 1000000}M`;
    if (inc >= 1000) return `${inc / 1000}K`;
    return inc.toString();
  };

  return (
    <div className="min-h-screen w-screen bg-zinc-950 text-white p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">CCTV Camera Feed Demo</h1>
        </div>

        {/* Configuration Inputs */}
        <div className="mb-6 p-4 bg-zinc-900 rounded-lg border border-zinc-800">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">
                Camera ID
              </label>
              <input
                type="text"
                value={cameraId}
                onChange={(e) => setCameraId(e.target.value)}
                className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="1438"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">
                Initial Timestamp
              </label>
              <input
                type="number"
                value={initialTimestamp}
                onChange={(e) => {
                  const value = parseInt(e.target.value, 10);
                  if (!isNaN(value)) {
                    setInitialTimestamp(value);
                  }
                }}
                className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="1768084420"
              />
            </div>
          </div>

          {/* Increment/Magnitude Selector */}
          <div className="border-t border-zinc-800 pt-4">
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              Timestamp Increment (Magnitude)
            </label>
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex gap-2 flex-wrap">
                {MAGNITUDES.map((mag, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setMagnitudeIndex(index);
                      setUseCustomIncrement(false);
                    }}
                    className={`px-3 py-1 text-xs rounded transition-colors border ${
                      !useCustomIncrement && magnitudeIndex === index
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-zinc-800 hover:bg-zinc-700 border-zinc-700"
                    }`}
                    title={`Increment by ${mag.value.toLocaleString()}`}
                  >
                    {mag.label}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <label className="text-xs text-zinc-400">Custom:</label>
                <input
                  type="number"
                  value={customIncrement}
                  onChange={(e) => {
                    const value = parseInt(e.target.value, 10);
                    if (!isNaN(value) && value > 0) {
                      setCustomIncrement(value);
                      setUseCustomIncrement(true);
                    }
                  }}
                  className="w-32 px-2 py-1 text-sm bg-zinc-800 border border-zinc-700 rounded text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="Custom"
                />
                <button
                  onClick={() => setUseCustomIncrement(!useCustomIncrement)}
                  className={`px-2 py-1 text-xs rounded transition-colors border ${
                    useCustomIncrement
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-zinc-800 hover:bg-zinc-700 border-zinc-700"
                  }`}
                >
                  Use
                </button>
              </div>
            </div>
            <p className="text-xs text-zinc-500 mt-2">
              Current increment: {currentIncrement.toLocaleString()} (
              {formatIncrement(currentIncrement)}) - Testing different magnitudes
              to find capture frequency
            </p>
          </div>
        </div>

        {/* Controls */}
        <div className="mb-6 flex items-center gap-4 flex-wrap">
          <button
            onClick={handlePlayPause}
            className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors border border-zinc-700"
          >
            {isPlaying ? (
              <>
                <Pause className="w-4 h-4" />
                Pause
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                Play
              </>
            )}
          </button>

          <button
            onClick={handleReset}
            className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors border border-zinc-700"
          >
            <RotateCcw className="w-4 h-4" />
            Reset
          </button>

          <div className="flex items-center gap-1 border-l border-zinc-700 pl-4">
            <button
              onClick={() => handleStep(false)}
              className="flex items-center gap-1 px-3 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors border border-zinc-700"
              title={`Step backward by ${formatIncrement(currentIncrement)}`}
            >
              <ChevronLeft className="w-4 h-4" />
              <span className="text-xs">Step</span>
            </button>
            <button
              onClick={() => handleStep(true)}
              className="flex items-center gap-1 px-3 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors border border-zinc-700"
              title={`Step forward by ${formatIncrement(currentIncrement)}`}
            >
              <span className="text-xs">Step</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-zinc-400 text-sm">Direction:</span>
            <button
              onClick={() =>
                setDirection(direction === "forward" ? "backward" : "forward")
              }
              className={`flex items-center gap-2 px-3 py-2 text-sm rounded transition-colors border ${
                direction === "backward"
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-zinc-800 hover:bg-zinc-700 border-zinc-700"
              }`}
            >
              <Rewind className="w-4 h-4" />
              Reverse
            </button>
            <button
              onClick={() => setDirection("forward")}
              className={`flex items-center gap-2 px-3 py-2 text-sm rounded transition-colors border ${
                direction === "forward"
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-zinc-800 hover:bg-zinc-700 border-zinc-700"
              }`}
            >
              <FastForward className="w-4 h-4" />
              Forward
            </button>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-zinc-400 text-sm">Frame Rate:</span>
            <div className="flex gap-2">
              {[1, 2, 4, 8].map((rate) => (
                <button
                  key={rate}
                  onClick={() => handleFrameRateChange(rate)}
                  className={`px-3 py-1 text-sm rounded ${
                    frameRate === rate
                      ? "bg-primary text-primary-foreground"
                      : "bg-zinc-800 hover:bg-zinc-700 border border-zinc-700"
                  } transition-colors`}
                >
                  {rate}x
                </button>
              ))}
            </div>
          </div>

          <div className="text-sm text-zinc-400">
            Current Time: {formatTimestamp(timestamp)}
          </div>
        </div>

        {/* Camera Feed */}
        <div className="relative w-full max-w-full bg-zinc-900 rounded-lg overflow-hidden border border-zinc-800">
          <div className="relative w-full" style={{ paddingBottom: "56.25%" }}>
            <img
              src={currentUrl}
              alt={`CCTV Camera ${cameraId} at ${timestamp}`}
              className="absolute top-0 left-0 w-full h-full object-contain"
              style={{ border: "none", maxWidth: "100%" }}
            />
          </div>

          {/* Overlay info */}
          <div className="absolute bottom-4 left-4 px-3 py-2 bg-black/70 backdrop-blur-sm rounded text-sm">
            Frame:{" "}
            {Math.floor((timestamp - initialTimestamp) / currentIncrement)} |
            Increment: {formatIncrement(currentIncrement)} | Direction:{" "}
            {direction === "forward" ? "▶" : "◀"} | Timestamp: {timestamp}
          </div>
        </div>

        {/* Info Section */}
        <div className="mt-6 p-4 bg-zinc-900 rounded-lg border border-zinc-800">
          <h2 className="text-lg font-semibold mb-2">About This Demo</h2>
          <p className="text-zinc-400 text-sm mb-2">
            This demo simulates video playback by incrementing the timestamp
            parameter in the CCTV feed URL. Each frame represents a snapshot
            from a different point in time.
          </p>
          <p className="text-zinc-500 text-xs">URL: {currentUrl}</p>
        </div>
      </div>
    </div>
  );
}
