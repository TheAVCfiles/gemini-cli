// web/demon-dance/main.jsx
import React, {
  useCallback,
  useEffect,
  useRef,
  useState
} from "https://esm.sh/react@18.3.1?dev";
import { createRoot } from "https://esm.sh/react-dom@18.3.1/client?dev";
import { jsx, jsxs } from "https://esm.sh/react@18.3.1?dev/jsx-runtime";
var teachers = [
  {
    name: "Zoe",
    emoji: "\u{1F483}",
    specialty: "Cute Moves",
    accentClass: "text-pink-400",
    highlightClass: "bg-pink-500/20"
  },
  {
    name: "Mira",
    emoji: "\u{1F98A}",
    specialty: "Power Moves",
    accentClass: "text-purple-400",
    highlightClass: "bg-purple-500/20"
  },
  {
    name: "Rumi",
    emoji: "\u26A1",
    specialty: "Speed Moves",
    accentClass: "text-yellow-300",
    highlightClass: "bg-yellow-400/20"
  }
];
var choreography = [
  { beat: 0, lane: 0, name: "Shadow Slide", durationBeats: 2, targetScore: 85 },
  { beat: 2, lane: 1, name: "Thunder Kick", durationBeats: 2, targetScore: 78 },
  { beat: 4, lane: 2, name: "Heart Pop", durationBeats: 2, targetScore: 92 },
  { beat: 6, lane: 0, name: "Spin Combo", durationBeats: 2, targetScore: 65 },
  { beat: 8, lane: 1, name: "Energy Wave", durationBeats: 2, targetScore: 90 },
  { beat: 10, lane: 2, name: "Laser Beam", durationBeats: 2, targetScore: 88 },
  { beat: 12, lane: 0, name: "Shadow Slide", durationBeats: 2, targetScore: 85 },
  { beat: 14, lane: 1, name: "Thunder Kick", durationBeats: 2, targetScore: 78 }
];
var BPM = 128;
function initToneMusic(onBeatCallback, onStopCallback) {
  if (typeof Tone === "undefined") {
    console.error("Tone.js not loaded. Cannot start music.");
    return { start: () => Promise.resolve(), stop: onStopCallback };
  }
  try {
    const bass = new Tone.MembraneSynth({
      envelope: { attack: 0.02, decay: 0.8, sustain: 0.05, release: 0.5 }
    }).toDestination();
    const hihat = new Tone.NoiseSynth({
      noise: { type: "white" },
      envelope: { attack: 1e-3, decay: 0.05, sustain: 0 }
    }).toDestination();
    const snare = new Tone.NoiseSynth({
      noise: { type: "pink" },
      envelope: { attack: 1e-3, decay: 0.15, sustain: 0 }
    }).toDestination();
    Tone.Transport.bpm.value = BPM;
    new Tone.Pattern(
      (time) => bass.triggerAttackRelease("C2", "8n", time),
      [0, 1, 0, 1]
    ).start(0).humanize = true;
    new Tone.Sequence(
      (time) => snare.triggerAttackRelease("16n", time),
      ["0:1", "0:3"]
    ).start(0);
    new Tone.Loop(
      (time) => hihat.triggerAttackRelease("32n", time, 0.5),
      "8n"
    ).start(0);
    let currentBeatIndex = 0;
    const lastMove = choreography[choreography.length - 1];
    const totalBeats = lastMove.beat + lastMove.durationBeats;
    Tone.Transport.scheduleRepeat((time) => {
      onBeatCallback(currentBeatIndex);
      currentBeatIndex = (currentBeatIndex + 1) % totalBeats;
    }, "4n");
    const start = async () => {
      await Tone.start();
      const dummyPlayer = new Audio();
      await dummyPlayer.play().catch(() => {
      });
      dummyPlayer.pause();
      Tone.Transport.start();
    };
    const stop = () => {
      Tone.Transport.stop();
      onStopCallback();
    };
    return { start, stop };
  } catch (error) {
    console.error("Error setting up Tone.js:", error);
    return { start: () => Promise.reject(error), stop: onStopCallback };
  }
}
function App() {
  const videoRef = useRef(null);
  const [streamActive, setStreamActive] = useState(false);
  const [currentBeat, setCurrentBeat] = useState(-1);
  const [isDancing, setIsDancing] = useState(false);
  const [matchScore, setMatchScore] = useState(0);
  const [selectedLane, setSelectedLane] = useState(0);
  const [feedbackText, setFeedbackText] = useState("Get ready to dance!");
  const [currentMove, setCurrentMove] = useState(null);
  const musicRef = useRef(null);
  const handleBeat = useCallback(
    (beatIndex) => {
      const beat = beatIndex % 16;
      setCurrentBeat(beat);
      const activeMove = choreography.find((move) => move.beat === beat) ?? null;
      setCurrentMove(activeMove);
      if (activeMove) {
        setFeedbackText(`New Move: ${activeMove.name}! Match the pose!`);
      }
      const baseScore = Math.floor(Math.random() * 40) + 50;
      const scoreAdjustment = activeMove && selectedLane === activeMove.lane ? Math.floor(Math.random() * 10) + 10 : 0;
      const finalScore = Math.min(100, baseScore + scoreAdjustment);
      setMatchScore(finalScore);
    },
    [selectedLane]
  );
  useEffect(() => {
    let isActive = true;
    const setupCamera = async () => {
      if (!navigator.mediaDevices) {
        console.error("MediaDevices not supported.");
        return;
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            facingMode: "user"
          },
          audio: false
        });
        if (videoRef.current && isActive) {
          videoRef.current.srcObject = stream;
          setStreamActive(true);
        }
      } catch (error) {
        console.error("Camera access denied or error:", error);
        setFeedbackText("\u{1F6D1} Camera Error: Please allow access to start dancing!");
      }
    };
    setupCamera();
    return () => {
      isActive = false;
      if (videoRef.current && videoRef.current.srcObject) {
        const tracks = videoRef.current.srcObject.getTracks();
        tracks.forEach((track) => track.stop());
      }
      if (musicRef.current) {
        musicRef.current.stop();
        musicRef.current = null;
      }
    };
  }, []);
  const toggleMusic = () => {
    if (!musicRef.current) {
      musicRef.current = initToneMusic(handleBeat, () => {
        setIsDancing(false);
        setCurrentBeat(-1);
        setCurrentMove(null);
      });
    }
    if (isDancing) {
      musicRef.current.stop();
      setIsDancing(false);
      setFeedbackText("Music stopped. Ready to start again!");
      return;
    }
    musicRef.current.start().then(() => {
      setIsDancing(true);
      setFeedbackText("Let's dance!");
    }).catch((error) => {
      console.error("Failed to start audio:", error);
      setFeedbackText("Failed to start audio. Try clicking again.");
    });
  };
  const getInstructorPoseStyle = (laneIndex) => {
    const isActive = currentMove && currentMove.lane === laneIndex && isDancing;
    if (!isActive) {
      return { opacity: 0 };
    }
    const isScaled = currentBeat % 4 < 2;
    return {
      opacity: 1,
      transition: "all 0.1s ease-out",
      transform: isScaled ? "scale(1.1) rotate(5deg)" : "scale(1.0) rotate(-5deg)",
      textShadow: "0 0 10px rgba(255, 255, 255, 0.8)"
    };
  };
  const getMatchRating = (score) => {
    if (score >= 90) return { emoji: "\u{1F525}", text: "PERFECT!", color: "text-red-400" };
    if (score >= 80) return { emoji: "\u2B50", text: "Great Match!", color: "text-yellow-400" };
    if (score >= 70) return { emoji: "\u{1F44D}", text: "Good Effort!", color: "text-green-400" };
    return { emoji: "\u{1F4AA}", text: "Keep Going!", color: "text-blue-400" };
  };
  const rating = getMatchRating(matchScore);
  return /* @__PURE__ */ jsxs("div", { className: "relative min-h-screen bg-gray-900 text-white font-inter overflow-hidden p-0 md:p-4 touch-none select-none", children: [
    /* @__PURE__ */ jsx("h1", { className: "text-4xl md:text-5xl font-extrabold text-center pt-4 mb-4 bg-clip-text text-transparent bg-gradient-to-r from-pink-400 to-purple-400", children: "K-Pop Dance Studio" }),
    /* @__PURE__ */ jsx("div", { className: "grid grid-cols-3 gap-1 md:gap-4 h-[60vh] md:h-[65vh] p-2 md:p-4", children: teachers.map((teacher, idx) => {
      const isSelected = selectedLane === idx;
      const isCurrentMove = currentMove && currentMove.lane === idx;
      return /* @__PURE__ */ jsx(
        "div",
        {
          className: `relative rounded-xl shadow-2xl transition-all duration-300 transform hover:scale-[1.01] cursor-pointer border-4 ${isSelected ? "border-yellow-400 scale-[1.01]" : "border-gray-800"}`,
          onClick: () => setSelectedLane(idx),
          children: /* @__PURE__ */ jsxs("div", { className: "bg-gray-800/70 h-full flex flex-col justify-between items-center text-center p-2 md:p-4 rounded-lg backdrop-blur-sm transition duration-300", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center", children: [
              /* @__PURE__ */ jsx(
                "span",
                {
                  className: `text-6xl md:text-8xl transition-all duration-200 ${isCurrentMove ? "animate-pulse" : ""}`,
                  style: getInstructorPoseStyle(idx),
                  children: teacher.emoji
                }
              ),
              /* @__PURE__ */ jsx("h3", { className: `font-bold text-xl mt-2 mb-1 ${teacher.accentClass}`, children: teacher.name }),
              /* @__PURE__ */ jsx("p", { className: "text-xs text-gray-400 hidden md:block", children: teacher.specialty })
            ] }),
            /* @__PURE__ */ jsx(
              "div",
              {
                className: `w-full p-2 rounded-lg transition-all duration-300 ${isCurrentMove ? teacher.highlightClass : "bg-gray-700/50"}`,
                children: /* @__PURE__ */ jsx("p", { className: "text-sm font-semibold", children: isCurrentMove ? currentMove.name : "Next Up!" })
              }
            )
          ] })
        },
        teacher.name
      );
    }) }),
    /* @__PURE__ */ jsxs("div", { className: "h-[40vh] md:h-[35vh] p-2 md:p-4 relative", children: [
      /* @__PURE__ */ jsx("div", { className: "absolute inset-0 z-10 flex flex-col justify-center items-center pointer-events-none", children: /* @__PURE__ */ jsxs("div", { className: "bg-black/60 p-3 md:p-6 rounded-2xl shadow-2xl border-2 border-purple-500 max-w-xs md:max-w-md w-full text-center", children: [
        /* @__PURE__ */ jsx("p", { className: "text-xl md:text-3xl font-bold mb-1", children: feedbackText }),
        /* @__PURE__ */ jsxs("div", { className: `text-5xl md:text-7xl font-extrabold ${rating.color}`, children: [
          rating.emoji,
          " ",
          matchScore,
          "%"
        ] }),
        /* @__PURE__ */ jsx("p", { className: "text-sm md:text-base text-gray-300", children: rating.text }),
        /* @__PURE__ */ jsxs("p", { className: "text-sm mt-1 text-pink-300", children: [
          "Tracking: ",
          teachers[selectedLane].name,
          "'s Lane"
        ] })
      ] }) }),
      /* @__PURE__ */ jsxs("div", { className: "relative h-full w-full rounded-xl overflow-hidden shadow-inner border-4 border-gray-700", children: [
        /* @__PURE__ */ jsx(
          "video",
          {
            ref: videoRef,
            autoPlay: true,
            playsInline: true,
            className: "w-full h-full object-cover",
            style: { transform: "scaleX(-1)" },
            muted: !streamActive
          }
        ),
        !streamActive && /* @__PURE__ */ jsx("div", { className: "absolute inset-0 bg-black/80 flex items-center justify-center", children: /* @__PURE__ */ jsx("p", { className: "text-xl text-red-400", children: "Waiting for Camera..." }) })
      ] })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "p-4 bg-gray-900 border-t border-gray-800 fixed bottom-0 left-0 w-full md:relative md:w-auto md:mt-4 md:flex md:justify-center", children: /* @__PURE__ */ jsx(
      "button",
      {
        onClick: toggleMusic,
        onTouchStart: (event) => event.preventDefault(),
        className: `min-h-16 w-full md:w-64 text-2xl font-bold rounded-xl shadow-lg transition-all duration-300 ${isDancing ? "bg-red-600 hover:bg-red-700" : "bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600"}`,
        children: isDancing ? "\u{1F6D1} STOP DANCING" : "\u{1F3B5} START DANCE CLASS"
      }
    ) }),
    /* @__PURE__ */ jsx("style", { children: `
        body {
          overscroll-behavior: none;
          -webkit-overflow-scrolling: touch;
        }
        video {
          -webkit-transform: translateZ(0);
        }
      ` })
  ] });
}
var rootElement = document.getElementById("root");
if (rootElement) {
  createRoot(rootElement).render(/* @__PURE__ */ jsx(App, {}));
}
