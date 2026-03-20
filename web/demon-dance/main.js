// web/demon-dance/main.jsx
import React, {
  useRef,
  useEffect,
  useState,
  useCallback
} from "https://esm.sh/react@18.3.1?dev";
import { createRoot } from "https://esm.sh/react-dom@18.3.1/client?dev";
import { Fragment, jsx, jsxs } from "https://esm.sh/react@18.3.1?dev/jsx-runtime";
var Cdns = () => /* @__PURE__ */ jsxs(Fragment, { children: [
  /* @__PURE__ */ jsx("script", { src: "https://cdnjs.cloudflare.com/ajax/libs/tone/14.8.49/Tone.min.js" }),
  /* @__PURE__ */ jsx("script", { src: "https://cdn.jsdelivr.net/npm/@tensorflow/tfjs-core@4.22.0/dist/tf.min.js" }),
  /* @__PURE__ */ jsx("script", { src: "https://cdn.jsdelivr.net/npm/@tensorflow/tfjs-backend-webgl@4.22.0/dist/tf-backend-webgl.min.js" }),
  /* @__PURE__ */ jsx("script", { src: "https://cdn.jsdelivr.net/npm/@tensorflow-models/pose-detection/dist/pose-detection.min.js" })
] });
var teachers = [
  { name: "Zoe", emoji: "\u{1F483}", color: "pink-500", specialty: "Cute Moves (Aegyo style)" },
  { name: "Mira", emoji: "\u{1F98A}", color: "purple-500", specialty: "Power Moves (Hard-hitting style)" },
  { name: "Rumi", emoji: "\u26A1", color: "yellow-500", specialty: "Speed Moves (Complex footwork style)" }
];
var COLOR_TEXT = {
  "pink-500": "text-pink-500",
  "purple-500": "text-purple-500",
  "yellow-500": "text-yellow-500"
};
var COLOR_BG_SOFT = {
  "pink-500": "bg-pink-500",
  "purple-500": "bg-purple-500",
  "yellow-500": "bg-yellow-500"
};
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
var POSE_TEMPLATES = {
  "Shadow Slide": {
    angles: [
      [["left_shoulder", "left_elbow", "left_wrist"], 160],
      [["right_shoulder", "right_elbow", "right_wrist"], 160],
      [["left_hip", "left_knee", "left_ankle"], 175],
      [["right_hip", "right_knee", "right_ankle"], 175]
    ]
  },
  "Thunder Kick": {
    angles: [
      [["right_hip", "right_knee", "right_ankle"], 60],
      [["left_hip", "left_knee", "left_ankle"], 175]
    ]
  },
  "Heart Pop": {
    angles: [
      [["left_shoulder", "left_elbow", "left_wrist"], 60],
      [["right_shoulder", "right_elbow", "right_wrist"], 60]
    ]
  },
  "Spin Combo": {
    angles: [
      [["left_shoulder", "left_hip", "left_knee"], 140],
      [["right_shoulder", "right_hip", "right_knee"], 140]
    ]
  },
  "Energy Wave": {
    angles: [
      [["left_shoulder", "left_elbow", "left_wrist"], 90],
      [["right_shoulder", "right_elbow", "right_wrist"], 150]
    ]
  },
  "Laser Beam": {
    angles: [
      [["left_shoulder", "left_elbow", "left_wrist"], 175],
      [["right_shoulder", "right_elbow", "right_wrist"], 30]
    ]
  }
};
var apiKey = "";
var LLM_MODEL = "gemini-2.5-flash-preview-09-2025";
function toVec(a, b) {
  return { x: b.x - a.x, y: b.y - a.y };
}
function dot(u, v) {
  return u.x * v.x + u.y * v.y;
}
function mag(u) {
  return Math.hypot(u.x, u.y);
}
function angleDeg(a, b, c) {
  const u = toVec(b, a);
  const v = toVec(b, c);
  const denom = mag(u) * mag(v);
  if (denom === 0) return 180;
  let cos = dot(u, v) / denom;
  cos = Math.max(-1, Math.min(1, cos));
  return Math.acos(cos) * 180 / Math.PI;
}
var NAME_TO_KEYPOINT = {
  nose: "nose",
  left_eye: "left_eye",
  right_eye: "right_eye",
  left_ear: "left_ear",
  right_ear: "right_ear",
  left_shoulder: "left_shoulder",
  right_shoulder: "right_shoulder",
  left_elbow: "left_elbow",
  right_elbow: "right_elbow",
  left_wrist: "left_wrist",
  right_wrist: "right_wrist",
  left_hip: "left_hip",
  right_hip: "right_hip",
  left_knee: "left_knee",
  right_knee: "right_knee",
  left_ankle: "left_ankle",
  right_ankle: "right_ankle"
};
function indexByName(keypoints) {
  const map = {};
  for (const kp of keypoints) {
    map[kp.name || kp.part || kp.key] = { x: kp.x, y: kp.y, score: kp.score ?? 1 };
  }
  return map;
}
function scorePoseAgainstTemplate(keypoints, template, confThresh = 0.2) {
  if (!template) return 0;
  const kp = indexByName(keypoints);
  let total = 0;
  let count = 0;
  for (const [triplet, targetDeg] of template.angles) {
    const [aName, bName, cName] = triplet;
    const a = kp[NAME_TO_KEYPOINT[aName]];
    const b = kp[NAME_TO_KEYPOINT[bName]];
    const c = kp[NAME_TO_KEYPOINT[cName]];
    if (!a || !b || !c) continue;
    if ((a.score ?? 0) < confThresh || (b.score ?? 0) < confThresh || (c.score ?? 0) < confThresh) continue;
    const ang = angleDeg(a, b, c);
    const err = Math.min(180, Math.abs(ang - targetDeg));
    const contribution = Math.max(0, 100 - err / 180 * 100);
    total += contribution;
    count += 1;
  }
  if (count === 0) return 0;
  return Math.round(total / count);
}
var exponentialBackoffFetch = async (url, options, maxRetries = 5) => {
  let delay = 1e3;
  for (let i = 0; i < maxRetries; i += 1) {
    try {
      const response = await fetch(url, options);
      if (!response.ok) {
        if (response.status === 429 && i < maxRetries - 1) {
          await new Promise((resolve) => setTimeout(resolve, delay));
          delay *= 2;
          continue;
        }
        throw new Error(`API request failed with status: ${response.status}`);
      }
      return response;
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await new Promise((resolve) => setTimeout(resolve, delay));
      delay *= 2;
    }
  }
  throw new Error("Request failed after retries");
};
function initToneMusic(onBeat, onStop) {
  if (typeof Tone === "undefined") {
    console.warn("Tone.js not loaded; music disabled.");
    return { isFallback: true, start: () => Promise.resolve(), stop: onStop };
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
    const kick = new Tone.Pattern(
      (time) => bass.triggerAttackRelease("C2", "8n", time),
      [0, 1, 0, 1]
    );
    kick.humanize = true;
    kick.start(0);
    new Tone.Sequence(
      (time) => snare.triggerAttackRelease("16n", time),
      ["0:1", "0:3"]
    ).start(0);
    new Tone.Loop(
      (time) => hihat.triggerAttackRelease("32n", time, 0.5),
      "8n"
    ).start(0);
    let beatIdx = 0;
    const totalBeats = choreography[choreography.length - 1].beat + choreography[choreography.length - 1].durationBeats;
    Tone.Transport.scheduleRepeat(() => {
      onBeat(beatIdx);
      beatIdx = (beatIdx + 1) % totalBeats;
    }, "4n");
    const start = async () => {
      await Tone.start();
      const el = new Audio();
      el.play().catch(() => {
      });
      el.pause();
      Tone.Transport.start();
    };
    const stop = () => {
      Tone.Transport.stop();
      onStop();
    };
    return { start, stop, isFallback: false };
  } catch (e) {
    console.error("Tone setup error:", e);
    return { isFallback: true, start: () => Promise.resolve(), stop: onStop };
  }
}
async function createMoveNetDetector() {
  if (typeof window === "undefined" || !window.poseDetection || !window.tf || !window.tf.getBackend) {
    return null;
  }
  const { poseDetection } = window;
  const tf = window.tf;
  try {
    await tf.setBackend("webgl");
    await tf.ready();
  } catch (error) {
    await tf.setBackend("cpu");
    await tf.ready();
  }
  try {
    const model = poseDetection.SupportedModels.MoveNet;
    const detector = await poseDetection.createDetector(model, {
      modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING
    });
    return detector;
  } catch (error) {
    console.error("MoveNet load failure:", error);
    return null;
  }
}
var FeedbackDisplay = ({ feedback, loading }) => {
  const ratingColorClass = COLOR_TEXT[feedback.color] || "text-gray-300";
  const ratingBgClass = COLOR_BG_SOFT[feedback.color] || "bg-gray-700";
  return /* @__PURE__ */ jsx("div", { className: "fixed top-0 left-0 right-0 z-50 p-4 pt-20 flex justify-center pointer-events-none", children: /* @__PURE__ */ jsxs(
    "div",
    {
      className: `max-w-xl w-full p-4 rounded-xl shadow-2xl backdrop-blur-md transition-all duration-300 transform         ${ratingBgClass} ${feedback.text === "No feedback yet." ? "bg-opacity-0" : "bg-opacity-30"}`,
      children: [
        /* @__PURE__ */ jsxs("p", { className: "text-lg font-bold", children: [
          feedback.teacher,
          " ",
          /* @__PURE__ */ jsx("span", { className: ratingColorClass, children: "says:" })
        ] }),
        /* @__PURE__ */ jsx("p", { className: `text-base ${loading ? "animate-pulse" : ""}`, children: feedback.text })
      ]
    }
  ) });
};
var PlaylistModal = ({ isOpen, onClose, playlist, loading, teacher }) => {
  if (!isOpen) return null;
  return /* @__PURE__ */ jsx("div", { className: "fixed inset-0 bg-black bg-opacity-70 backdrop-blur-sm z-[100] flex items-center justify-center p-4", children: /* @__PURE__ */ jsxs("div", { className: "bg-gray-800 rounded-xl p-6 md:p-8 w-full max-w-lg shadow-2xl border-2 border-yellow-500", children: [
    /* @__PURE__ */ jsxs("h2", { className: "text-3xl font-extrabold text-yellow-400 mb-4", children: [
      teacher.name,
      "'s Hype Playlist"
    ] }),
    /* @__PURE__ */ jsxs("p", { className: "text-gray-300 mb-6", children: [
      "These recommendations are perfect for practicing your ",
      teacher.specialty,
      " choreography at ",
      BPM,
      " BPM!"
    ] }),
    loading ? /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center justify-center h-24", children: [
      /* @__PURE__ */ jsx("div", { className: "animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-500 mb-3" }),
      /* @__PURE__ */ jsx("p", { className: "text-yellow-400", children: "Searching the charts..." })
    ] }) : playlist.length === 0 ? /* @__PURE__ */ jsx("p", { className: "text-red-400", children: "Could not generate a playlist. Try again." }) : /* @__PURE__ */ jsx("ul", { className: "space-y-3", children: playlist.map((item, index) => /* @__PURE__ */ jsxs(
      "li",
      {
        className: "flex items-start bg-gray-700 p-3 rounded-lg border-l-4 border-purple-400 shadow-md",
        children: [
          /* @__PURE__ */ jsxs("span", { className: "text-xl mr-3 mt-1 text-pink-400 font-bold", children: [
            index + 1,
            "."
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("p", { className: "font-semibold text-white", children: item.title }),
            /* @__PURE__ */ jsx("p", { className: "text-sm text-gray-400", children: item.artist })
          ] })
        ]
      },
      index
    )) }),
    /* @__PURE__ */ jsx(
      "button",
      {
        onClick: onClose,
        className: "mt-8 w-full py-3 bg-purple-600 text-white font-bold rounded-lg hover:bg-purple-700 transition duration-200",
        children: "Back to Studio"
      }
    )
  ] }) });
};
var KPopDanceStudio = () => {
  const videoRef = useRef(null);
  const [streamActive, setStreamActive] = useState(false);
  const [currentBeat, setCurrentBeat] = useState(-1);
  const [isDancing, setIsDancing] = useState(false);
  const [matchScore, setMatchScore] = useState(0);
  const [selectedLane, setSelectedLane] = useState(0);
  const [feedbackText, setFeedbackText] = useState("Get ready to dance!");
  const [currentMove, setCurrentMove] = useState(null);
  const [llmFeedback, setLlmFeedback] = useState({
    text: "No feedback yet.",
    teacher: teachers[0].name,
    color: teachers[0].color
  });
  const [llmLoading, setLlmLoading] = useState(false);
  const [playlistModalOpen, setPlaylistModalOpen] = useState(false);
  const [playlistLoading, setPlaylistLoading] = useState(false);
  const [hypePlaylist, setHypePlaylist] = useState([]);
  const musicRef = useRef(null);
  const detectorRef = useRef(null);
  const rafRef = useRef(0);
  const getTeacherFeedback = useCallback(async () => {
    if (llmLoading || !currentMove) return;
    setLlmLoading(true);
    const teacher = teachers[selectedLane];
    const move = currentMove;
    const currentScore = matchScore;
    setLlmFeedback({
      text: "\u2728 Generating personalized advice...",
      teacher: teacher.name,
      color: teacher.color
    });
    const systemPrompt = `You are ${teacher.name}, a K-Pop dance instructor specializing in ${teacher.specialty}. Your feedback must be encouraging, in-character, and use common K-Pop/dance terminology (like 'aegyo', 'bias', 'fighting!'). Keep the response to 2-3 concise sentences. The user just attempted the move.`;
    const userQuery = `The user attempted the move: '${move.name}' (Target Lane: ${teacher.name}) and achieved a score of ${currentScore}%. The target score for this move is ${move.targetScore}%. Give personalized, constructive feedback based on their score and your specialty.`;
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${LLM_MODEL}:generateContent?key=${apiKey}`;
    const payload = {
      contents: [{ parts: [{ text: userQuery }] }],
      systemInstruction: { parts: [{ text: systemPrompt }] }
    };
    try {
      const response = await exponentialBackoffFetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const result = await response.json();
      const text = result.candidates?.[0]?.content?.parts?.[0]?.text || "Oops, my mic cut out! Try again, fighting!";
      setLlmFeedback({ text, teacher: teacher.name, color: teacher.color });
    } catch (error) {
      console.error("Gemini API Error (Feedback):", error);
      setLlmFeedback({
        text: "API call failed. Check console for details.",
        teacher: teacher.name,
        color: teacher.color
      });
    } finally {
      setLlmLoading(false);
    }
  }, [selectedLane, currentMove, matchScore, llmLoading]);
  const generateHypePlaylist = useCallback(async () => {
    if (playlistLoading) return;
    setPlaylistModalOpen(true);
    setPlaylistLoading(true);
    setHypePlaylist([]);
    const teacher = teachers[selectedLane];
    const systemPrompt = `You are a K-Pop music curator. Your job is to suggest exactly 3 K-Pop songs that are suitable for high-energy choreography around ${BPM} BPM. For each song, output ONLY the song title and the artist on a new line. Do not add any extra commentary, introductory text, or numbering.`;
    const userQuery = `Suggest 3 K-Pop songs for a playlist based on the specialty: ${teacher.specialty}.`;
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${LLM_MODEL}:generateContent?key=${apiKey}`;
    const payload = {
      contents: [{ parts: [{ text: userQuery }] }],
      tools: [{ google_search: {} }],
      systemInstruction: { parts: [{ text: systemPrompt }] }
    };
    try {
      const response = await exponentialBackoffFetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const result = await response.json();
      const text = result.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text) {
        const lines = text.split("\n").filter((line) => line.trim() !== "");
        const newPlaylist = lines.map((line) => {
          const parts = line.split(/ - | \(/);
          if (parts.length >= 2) {
            return {
              title: parts[0].trim(),
              artist: parts[parts.length - 1].replace(/\)$/g, "").trim()
            };
          }
          return { title: line.trim(), artist: "Unknown Artist" };
        }).slice(0, 3);
        setHypePlaylist(newPlaylist);
      }
    } catch (error) {
      console.error("Gemini API Error (Playlist):", error);
    } finally {
      setPlaylistLoading(false);
    }
  }, [selectedLane, playlistLoading]);
  const handleBeat = useCallback((beatIndex) => {
    const beat = beatIndex % 16;
    setCurrentBeat(beat);
    const active = choreography.find((m) => m.beat === beat);
    if (active) {
      setCurrentMove(active);
      setFeedbackText(`New Move: ${active.name}! Match the pose!`);
    }
  }, []);
  useEffect(() => {
    (async () => {
      if (!navigator.mediaDevices) {
        console.error("MediaDevices not supported.");
        return;
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: "user" },
          audio: false
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          setStreamActive(true);
        }
      } catch (err) {
        console.error("Camera error:", err);
        setFeedbackText("\u{1F6D1} Camera Error: Please allow access to start dancing!");
      }
    })();
    return () => {
      if (videoRef.current?.srcObject) {
        videoRef.current.srcObject.getTracks().forEach((track) => track.stop());
      }
      if (musicRef.current && typeof musicRef.current.stop === "function") {
        musicRef.current.stop();
      }
      cancelAnimationFrame(rafRef.current);
    };
  }, []);
  useEffect(() => {
    let running = true;
    async function tick() {
      if (!running) return;
      const det = detectorRef.current;
      const vid = videoRef.current;
      if (det && vid && vid.readyState >= 2) {
        try {
          const poses = await det.estimatePoses(vid, { flipHorizontal: true });
          const pose = poses?.[0];
          if (pose && currentMove && isDancing && selectedLane === currentMove.lane) {
            const template = POSE_TEMPLATES[currentMove.name];
            const score = scorePoseAgainstTemplate(pose.keypoints, template, 0.2);
            setMatchScore((prev) => Math.round(prev * 0.6 + score * 0.4));
          } else if (pose && currentMove && isDancing) {
            const template = POSE_TEMPLATES[currentMove.name];
            const score = Math.max(
              0,
              scorePoseAgainstTemplate(pose.keypoints, template, 0.2) - 15
            );
            setMatchScore((prev) => Math.round(prev * 0.6 + score * 0.4));
          }
        } catch (error) {
        }
      }
      rafRef.current = requestAnimationFrame(tick);
    }
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      running = false;
      cancelAnimationFrame(rafRef.current);
    };
  }, [currentMove, isDancing, selectedLane]);
  const toggleMusic = () => {
    const shouldInitialize = !musicRef.current || musicRef.current.isFallback;
    if (shouldInitialize) {
      musicRef.current = initToneMusic(handleBeat, () => {
        setIsDancing(false);
        setCurrentBeat(-1);
        setCurrentMove(null);
      });
      if (musicRef.current.isFallback) {
        setFeedbackText("Music library loading... click START again in a moment.");
        return;
      }
    }
    if (isDancing) {
      musicRef.current.stop();
      setIsDancing(false);
      setFeedbackText("Music stopped. Ready to start again!");
    } else {
      musicRef.current.start().then(async () => {
        if (!detectorRef.current) {
          setFeedbackText("Loading pose model\u2026");
          detectorRef.current = await createMoveNetDetector();
          if (!detectorRef.current) {
            setFeedbackText("Pose model unavailable. You can still dance!");
          }
        }
        setIsDancing(true);
        setFeedbackText("Let's dance!");
      }).catch((error) => {
        console.error("Audio start failed:", error);
        setFeedbackText("Failed to start audio. Tap again.");
      });
    }
  };
  const getInstructorPoseStyle = (laneIndex) => {
    const isActive = currentMove && currentMove.lane === laneIndex && isDancing;
    if (!isActive) return { opacity: 0 };
    return {
      opacity: 1,
      transition: "all 0.1s ease-out",
      transform: currentBeat % 4 < 2 ? "scale(1.1) rotate(5deg)" : "scale(1.0) rotate(-5deg)",
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
    /* @__PURE__ */ jsx(Cdns, {}),
    /* @__PURE__ */ jsx(
      PlaylistModal,
      {
        isOpen: playlistModalOpen,
        onClose: () => setPlaylistModalOpen(false),
        playlist: hypePlaylist,
        loading: playlistLoading,
        teacher: teachers[selectedLane]
      }
    ),
    /* @__PURE__ */ jsx(FeedbackDisplay, { feedback: llmFeedback, loading: llmLoading }),
    /* @__PURE__ */ jsx("h1", { className: "text-4xl md:text-5xl font-extrabold text-center pt-4 mb-4 bg-clip-text text-transparent bg-gradient-to-r from-pink-400 to-purple-400", children: "K-Pop Dance Studio" }),
    /* @__PURE__ */ jsx("div", { className: "grid grid-cols-3 gap-1 md:gap-4 h-[60vh] md:h-[65vh] p-2 md:p-4", children: teachers.map((teacher, idx) => /* @__PURE__ */ jsx(
      "div",
      {
        className: `relative rounded-xl shadow-2xl transition-all duration-300 transform hover:scale-[1.01] cursor-pointer                border-4 ${selectedLane === idx ? "border-yellow-400 scale-[1.01]" : "border-gray-800"}`,
        onClick: () => setSelectedLane(idx),
        children: /* @__PURE__ */ jsxs("div", { className: "bg-gray-800 bg-opacity-70 h-full flex flex-col justify-between items-center text-center p-2 md:p-4 rounded-lg backdrop-blur-sm transition duration-300", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center", children: [
            /* @__PURE__ */ jsx(
              "span",
              {
                className: `text-6xl md:text-8xl transition-all duration-200 ${currentMove && currentMove.lane === idx ? "animate-pulse" : ""}`,
                style: getInstructorPoseStyle(idx),
                children: teacher.emoji
              }
            ),
            /* @__PURE__ */ jsx("h3", { className: `font-bold text-xl mt-2 mb-1 ${COLOR_TEXT[teacher.color]}`, children: teacher.name }),
            /* @__PURE__ */ jsx("p", { className: "text-xs text-gray-400 hidden md:block", children: teacher.specialty })
          ] }),
          /* @__PURE__ */ jsx(
            "div",
            {
              className: `w-full p-2 rounded-lg transition-all duration-300 ${currentMove && currentMove.lane === idx ? `${COLOR_BG_SOFT[teacher.color]} bg-opacity-20` : "bg-gray-700 bg-opacity-50"}`,
              children: /* @__PURE__ */ jsx("p", { className: "text-sm font-semibold", children: currentMove && currentMove.lane === idx ? currentMove.name : "Next Up!" })
            }
          )
        ] })
      },
      idx
    )) }),
    /* @__PURE__ */ jsxs("div", { className: "h-[40vh] md:h-[35vh] p-2 md:p-4 relative", children: [
      /* @__PURE__ */ jsx("div", { className: "absolute inset-0 z-10 flex flex-col justify-center items-center pointer-events-none", children: /* @__PURE__ */ jsxs("div", { className: "bg-black bg-opacity-60 p-3 md:p-6 rounded-2xl shadow-2xl border-2 border-purple-500 max-w-xs md:max-w-md w-full text-center", children: [
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
        !streamActive && /* @__PURE__ */ jsx("div", { className: "absolute inset-0 bg-black bg-opacity-80 flex items-center justify-center", children: /* @__PURE__ */ jsx("p", { className: "text-xl text-red-400", children: "Waiting for Camera..." }) })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "p-4 bg-gray-900 border-t border-gray-800 fixed bottom-0 left-0 w-full md:relative md:w-auto md:mt-4 md:flex md:justify-center gap-4", children: [
      /* @__PURE__ */ jsx(
        "button",
        {
          onClick: toggleMusic,
          onTouchStart: (event) => event.preventDefault(),
          className: `min-h-16 w-full md:w-56 text-2xl font-bold rounded-xl shadow-lg transition-all duration-300 mb-2 md:mb-0
            ${isDancing ? "bg-red-600 hover:bg-red-700" : "bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600"}`,
          children: isDancing ? "\u{1F6D1} STOP DANCING" : "\u{1F3B5} START DANCE CLASS"
        }
      ),
      /* @__PURE__ */ jsx(
        "button",
        {
          onClick: getTeacherFeedback,
          onTouchStart: (event) => event.preventDefault(),
          disabled: llmLoading || !currentMove,
          className: `min-h-16 w-full md:w-56 text-lg font-bold rounded-xl shadow-lg transition-all duration-300 mb-2 md:mb-0
            ${llmLoading || !currentMove ? "bg-gray-700 text-gray-400 cursor-not-allowed" : "bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-gray-900"}`,
          children: llmLoading ? "Analyzing..." : `Get Feedback \u2728 (${teachers[selectedLane].name})`
        }
      ),
      /* @__PURE__ */ jsx(
        "button",
        {
          onClick: generateHypePlaylist,
          onTouchStart: (event) => event.preventDefault(),
          disabled: playlistLoading,
          className: `min-h-16 w-full md:w-56 text-lg font-bold rounded-xl shadow-lg transition-all duration-300
            ${playlistLoading ? "bg-gray-700 text-gray-400 cursor-not-allowed" : "bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-500 hover:to-blue-600 text-white"}`,
          children: playlistLoading ? "Generating..." : "Hype Playlist Generator \u2728"
        }
      )
    ] }),
    /* @__PURE__ */ jsx("style", { children: `
        body { overscroll-behavior: none; -webkit-overflow-scrolling: touch; }
        video { -webkit-transform: translateZ(0); }
      ` })
  ] });
};
var root = document.getElementById("root");
if (root) {
  createRoot(root).render(/* @__PURE__ */ jsx(KPopDanceStudio, {}));
}
var main_default = KPopDanceStudio;
export {
  main_default as default
};
