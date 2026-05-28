import React, { useState, useEffect, useRef } from "react";
import { 
  Dog, Mic, MicOff, Volume2, VolumeX, Plus, Trash2, Edit2, Save, Download, 
  Printer, FileText, CheckCircle2, AlertCircle, RefreshCw, Trophy, Calendar, Check,
  ChevronRight, ArrowRight, Sparkles, Upload, Loader2, ArrowUpRight
} from "lucide-react";
import { DogProfile, TrainingLog, Milestone, ChatMessage, LogStatus } from "./types";

const AVAILABLE_BREEDS = [
  "Golden Retriever", "German Shepherd", "Labrador Retriever", "French Bulldog", 
  "Beagle", "Poodle", "Rottweiler", "Yorkshire Terrier", "Boxer", "Siberian Husky", "Mixed Breed"
];

const PRESET_SKILLS = [
  "Sit", "Stay", "Heel", "Recall (Come)", "Leash Walking", "Leave It", "Crate Training", "Housebreaking"
];

export default function App() {
  // --- Persistent Local States ---
  const [profile, setProfile] = useState<DogProfile>(() => {
    const saved = localStorage.getItem("dog_profile");
    if (saved) return JSON.parse(saved);
    return {
      id: "dog-1",
      name: "Buster",
      breed: "Golden Retriever",
      birthdate: "2025-06-01",
      weight: 42,
      goals: ["Master leash-walking with distractions", "Perfect instant recall off-leash", "Crate calm for 2 hours"]
    };
  });

  const [logs, setLogs] = useState<TrainingLog[]>(() => {
    const saved = localStorage.getItem("training_logs");
    if (saved) return JSON.parse(saved);
    return [
      {
        id: "log-1",
        dogId: "dog-1",
        timestamp: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString(),
        skill: "Sit",
        status: "success",
        notes: "Held sit for 60 seconds with toys scattered nearby. Strong focus today.",
        durationMinutes: 5
      },
      {
        id: "log-2",
        dogId: "dog-1",
        timestamp: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(),
        skill: "Heel",
        status: "in_progress",
        notes: "Good pacing but lost focus slightly when another dog passed by.",
        durationMinutes: 10
      },
      {
        id: "log-3",
        dogId: "dog-1",
        timestamp: new Date(Date.now() - 1 * 24 * 3600 * 1000).toISOString(),
        skill: "Recall (Come)",
        status: "needs_work",
        notes: "Difficult response today. Ignored initial calls while chasing a tennis ball.",
        durationMinutes: 8
      }
    ];
  });

  const [milestones, setMilestones] = useState<Milestone[]>(() => {
    const saved = localStorage.getItem("milestones");
    if (saved) return JSON.parse(saved);
    return [
      {
        id: "m-1",
        dogId: "dog-1",
        title: "Fully Housebroken Achieved",
        dateEarned: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString().split('T')[0],
        notes: "14 consecutive days without accidents inside."
      },
      {
        id: "m-2",
        dogId: "dog-1",
        title: "First Distracted Recall",
        dateEarned: new Date().toISOString().split('T')[0],
        notes: "Responded under high distraction at the local park."
      }
    ];
  });

  const [chatHistory, setChatHistory] = useState<ChatMessage[]>(() => {
    const saved = localStorage.getItem("chat_history");
    if (saved) return JSON.parse(saved);
    return [
      {
        id: "init-msg",
        sender: "assistant",
        text: "I am EVE, your training assistant. I am ready to help. You can speak or type your leash work, commands, or milestones, and I will record the progress. If you are walking, toggle Voice Readout (TTS) and Mic Dictation below.",
        timestamp: new Date().toISOString()
      }
    ];
  });

  // --- UI Layout state ---
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileName, setProfileName] = useState(profile.name);
  const [profileBreed, setProfileBreed] = useState(profile.breed);
  const [profileBirthdate, setProfileBirthdate] = useState(profile.birthdate);
  const [profileWeight, setProfileWeight] = useState(profile.weight);
  const [newGoal, setNewGoal] = useState("");

  // --- Manual Actions Input ---
  const [selectedSkill, setSelectedSkill] = useState("Sit");
  const [quickDuration, setQuickDuration] = useState(5);
  const [quickStatus, setQuickStatus] = useState<LogStatus>("success");
  const [quickNotes, setQuickNotes] = useState("");

  // --- Custom Milestones Input ---
  const [newMilestoneTitle, setNewMilestoneTitle] = useState("");
  const [newMilestoneNotes, setNewMilestoneNotes] = useState("");

  // --- Chat interaction & Speech States ---
  const [userText, setUserText] = useState("");
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [speechRecognitionSupported, setSpeechRecognitionSupported] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isTtsActive, setIsTtsActive] = useState(false); // Text-To-Speech toggle

  // --- Export Previews & Modals ---
  const [showMarkdownModal, setShowMarkdownModal] = useState(false);
  const [showPrintPreviewModal, setShowPrintPreviewModal] = useState(false);
  const [importJsonText, setImportJsonText] = useState("");
  const [importStatus, setImportStatus] = useState<string | null>(null);

  const chatBottomRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  // --- Sync storage changes ---
  useEffect(() => {
    localStorage.setItem("dog_profile", JSON.stringify(profile));
  }, [profile]);

  useEffect(() => {
    localStorage.setItem("training_logs", JSON.stringify(logs));
  }, [logs]);

  useEffect(() => {
    localStorage.setItem("milestones", JSON.stringify(milestones));
  }, [milestones]);

  useEffect(() => {
    localStorage.setItem("chat_history", JSON.stringify(chatHistory));
    scrollChat();
  }, [chatHistory]);

  const scrollChat = () => {
    setTimeout(() => {
      chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 50);
  };

  // --- Setup Speech Recognition (Hands-Free Dictation) ---
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      setSpeechRecognitionSupported(true);
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = "en-US";

      rec.onstart = () => {
        setIsListening(true);
      };

      rec.onerror = (e: any) => {
        console.error("Speech Recognition Error", e);
        setIsListening(false);
      };

      rec.onend = () => {
        setIsListening(false);
      };

      rec.onresult = (event: any) => {
        const text = event.results[0][0].transcript;
        if (text) {
          setUserText((prev) => (prev ? prev + " " + text : text));
        }
      };

      recognitionRef.current = rec;
    }
  }, []);

  const toggleListening = () => {
    if (!recognitionRef.current) return;
    if (isListening) {
      recognitionRef.current.stop();
    } else {
      recognitionRef.current.start();
    }
  };

  // --- Voice Readout (TTS) helper ---
  const speakText = (text: string) => {
    if (!isTtsActive) return;
    if ("speechSynthesis" in window) {
      // Cancel outstanding speech
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      utterance.pitch = 0.95; // slightly lower pitch for EVE's professional, calm tone
      window.speechSynthesis.speak(utterance);
    }
  };

  // --- Profile state controls ---
  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setProfile({
      ...profile,
      name: profileName || "unnamed pet",
      breed: profileBreed,
      birthdate: profileBirthdate,
      weight: Number(profileWeight) || 0
    });
    setIsEditingProfile(false);
  };

  const handleAddGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGoal.trim()) return;
    setProfile(prev => ({
      ...prev,
      goals: [...prev.goals, newGoal.trim()]
    }));
    setNewGoal("");
  };

  const handleRemoveGoal = (index: number) => {
    setProfile(prev => ({
      ...prev,
      goals: prev.goals.filter((_, i) => i !== index)
    }));
  };

  // --- Manual Log Entry Adders ---
  const handleQuickAddLog = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const newLog: TrainingLog = {
      id: "manual-" + Date.now(),
      dogId: profile.id,
      timestamp: new Date().toISOString(),
      skill: selectedSkill,
      status: quickStatus,
      durationMinutes: quickDuration,
      notes: quickNotes.trim() || `Conducted ${quickDuration}-minute training session on ${selectedSkill}.`
    };
    setLogs((prev) => [newLog, ...prev]);
    setQuickNotes("");

    // Automatically trigger an event summary confirmation from the chatbot
    const systemFeedbackMsg: ChatMessage = {
      id: "sys-" + Date.now(),
      sender: "assistant",
      text: `Tactile log added: Buster practiced ${selectedSkill} for ${quickDuration} minutes. Performance marked as ${quickStatus.replace("_", " ")}.`,
      timestamp: new Date().toISOString()
    };
    setChatHistory(prev => [...prev, systemFeedbackMsg]);
    speakText(systemFeedbackMsg.text);
  };

  const handleAddMilestone = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMilestoneTitle.trim()) return;
    const newM: Milestone = {
      id: "m-" + Date.now(),
      dogId: profile.id,
      title: newMilestoneTitle.trim(),
      dateEarned: new Date().toISOString().split('T')[0],
      notes: newMilestoneNotes.trim() || "Achieved during regular training exercises."
    };
    setMilestones(prev => [newM, ...prev]);
    setNewMilestoneTitle("");
    setNewMilestoneNotes("");

    const chatbotConfirmation: ChatMessage = {
      id: "m-sys-" + Date.now(),
      sender: "assistant",
      text: `Logged milestone achievement for ${profile.name}: "${newM.title}". Added to behavioral progress reports securely.`,
      timestamp: new Date().toISOString()
    };
    setChatHistory(prev => [...prev, chatbotConfirmation]);
    speakText(chatbotConfirmation.text);
  };

  const handleDeleteLog = (id: string) => {
    setLogs(prev => prev.filter(log => log.id !== id));
  };

  const handleDeleteMilestone = (id: string) => {
    setMilestones(prev => prev.filter(m => m.id !== id));
  };

  // --- AI Chatbot Interface core logic ---
  const handleSendChat = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanMsg = userText.trim();
    if (!cleanMsg) return;

    // Append user message immediately
    const userMsg: ChatMessage = {
      id: "user-" + Date.now(),
      sender: "user",
      text: cleanMsg,
      timestamp: new Date().toISOString()
    };
    setChatHistory((prev) => [...prev, userMsg]);
    setUserText("");
    setIsAiLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: cleanMsg,
          history: chatHistory.slice(-6) // Send small sliding window of logs to keep token count compact
        })
      });

      if (!response.ok) {
        throw new Error("Local backend or server response error.");
      }

      const result = await response.json();

      let parsedReply = result.reply || "No response received.";
      // Instantiate standard training logs if Gemini parsed one successfully
      if (result.parsedLog && result.parsedLog.loggedType !== "none") {
        const details = result.parsedLog.details;
        if (result.parsedLog.loggedType === "training") {
          const newAutoLog: TrainingLog = {
            id: "auto-" + Date.now(),
            dogId: profile.id,
            timestamp: new Date().toISOString(),
            skill: details.skill || "General Work",
            status: (details.status as LogStatus) || "in_progress",
            durationMinutes: details.durationMinutes || 5,
            notes: details.notes || "Recorded via chatbot voice extraction."
          };
          setLogs((prev) => [newAutoLog, ...prev]);
        } else if (result.parsedLog.loggedType === "milestone") {
          const newAutoM: Milestone = {
            id: "auto-m-" + Date.now(),
            dogId: profile.id,
            title: details.title || "Spontaneous Achievement",
            dateEarned: new Date().toISOString().split('T')[0],
            notes: details.notes || "Extracted from chatbot query."
          };
          setMilestones((prev) => [newAutoM, ...prev]);
        }
      }

      const assistantMsg: ChatMessage = {
        id: "ai-" + Date.now(),
        sender: "assistant",
        text: parsedReply,
        timestamp: new Date().toISOString(),
        parsedActionLog: result.parsedLog
      };

      setChatHistory((prev) => [...prev, assistantMsg]);
      speakText(parsedReply);

    } catch (err: any) {
      console.error(err);
      const errReply = "An error occurred attempting to reach the server parser. Check Internet connections.";
      setChatHistory((prev) => [...prev, {
        id: "ai-err-" + Date.now(),
        sender: "assistant",
        text: errReply,
        timestamp: new Date().toISOString()
      }]);
      speakText(errReply);
    } finally {
      setIsAiLoading(false);
    }
  };

  // --- Exports Functions ---

  // 1. Export standard Spreadsheet (CSV Format)
  const handleExportCSV = () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Type,Date,Activity/Skill/Title,Status,Duration (Mins),Notes\r\n";

    logs.forEach((log) => {
      const row = [
        "Training",
        new Date(log.timestamp).toLocaleDateString(),
        `"${log.skill.replace(/"/g, '""')}"`,
        log.status,
        log.durationMinutes,
        `"${log.notes.replace(/"/g, '""')}"`
      ].join(",");
      csvContent += row + "\r\n";
    });

    milestones.forEach((m) => {
      const row = [
        "Milestone",
        new Date(m.dateEarned).toLocaleDateString(),
        `"${m.title.replace(/"/g, '""')}"`,
        "success",
        "0",
        `"${m.notes.replace(/"/g, '""')}"`
      ].join(",");
      csvContent += row + "\r\n";
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${profile.name}_Training_Data_Export.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 2. Format a Markdown report for easy copy-pasting
  const generateMarkdownReport = () => {
    let report = `# Dog Behavioral & Training Report: ${profile.name}\n`;
    report += `**Breed:** ${profile.breed} | **Birthdate:** ${profile.birthdate} | **Weight:** ${profile.weight} lbs\n`;
    report += `**Generated:** ${new Date().toLocaleDateString()}\n\n`;

    report += `## Executive Training Objectives\n`;
    profile.goals.forEach((goal) => {
      report += `- [ ] ${goal}\n`;
    });
    if (profile.goals.length === 0) report += `*No objective goals mapped to this pet profile.*\n`;

    report += `\n## Behavioral Milestones & Accomplishments\n`;
    milestones.forEach((m) => {
      report += `- **${m.title}** (${new Date(m.dateEarned).toLocaleDateString()})\n  *Notes:* ${m.notes}\n`;
    });
    if (milestones.length === 0) report += `*No custom behavioral milestones mapped yet.*\n`;

    report += `\n## Recent Training Logs\n`;
    logs.forEach((log) => {
      const dateStr = new Date(log.timestamp).toLocaleDateString();
      report += `### ${log.skill} - ${dateStr}\n`;
      report += `- **Status**: ${log.status.toUpperCase().replace("_", " ")}\n`;
      report += `- **Duration**: ${log.durationMinutes} minutes\n`;
      report += `- **Notes**: ${log.notes}\n\n`;
    });
    if (logs.length === 0) report += `*No training exercises logged yet.*\n`;

    return report;
  };

  // 3. Export JSON data backup file
  const handleExportJSON = () => {
    const backupData = {
      profile,
      logs,
      milestones,
      chatHistory,
      exportedAt: new Date().toISOString()
    };
    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(backupData, null, 2))}`;
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", jsonString);
    downloadAnchor.setAttribute("download", `${profile.name}_backup_data.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    document.body.removeChild(downloadAnchor);
  };

  // 4. Import JSON data layout
  const handleImportJSONAction = () => {
    try {
      if (!importJsonText.trim()) {
        setImportStatus("Please paste valid JSON before importing.");
        return;
      }
      const parsed = JSON.parse(importJsonText);
      if (parsed.profile) setProfile(parsed.profile);
      if (parsed.logs) setLogs(parsed.logs);
      if (parsed.milestones) setMilestones(parsed.milestones);
      if (parsed.chatHistory) setChatHistory(parsed.chatHistory);
      
      setImportStatus("Import successful! Data restored to LocalStorage.");
      setTimeout(() => {
        setImportJsonText("");
        setImportStatus(null);
      }, 3000);
    } catch {
      setImportStatus("Invalid JSON structure. Ensure file matches export layout.");
    }
  };

  // --- SVG Charts Calculator ---
  const analyticsByDays = () => {
    const dailyMins: Record<string, number> = {};
    const daysArr: string[] = [];

    // Last 7 days labels
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const label = d.toLocaleDateString(undefined, { weekday: "short" });
      const fullDateStr = d.toDateString();
      dailyMins[fullDateStr] = 0;
      daysArr.push(fullDateStr);
    }

    logs.forEach((log) => {
      const dateKey = new Date(log.timestamp).toDateString();
      if (dateKey in dailyMins) {
        dailyMins[dateKey] += log.durationMinutes;
      }
    });

    const maxValue = Math.max(...Object.values(dailyMins), 15);

    return {
      days: daysArr.map(dStr => ({
        label: new Date(dStr).toLocaleDateString(undefined, { weekday: "short" }),
        minutes: dailyMins[dStr]
      })),
      max: maxValue
    };
  };

  const statusRatio = () => {
    let success = 0, progress = 0, work = 0;
    logs.forEach(l => {
      if (l.status === "success") success++;
      else if (l.status === "in_progress") progress++;
      else if (l.status === "needs_work") work++;
    });
    const total = logs.length || 1;
    return {
      success: Math.round((success / total) * 100),
      progress: Math.round((progress / total) * 100),
      work: Math.round((work / total) * 100),
      successCount: success,
      progressCount: progress,
      workCount: work
    };
  };

  const totalTrainingMinutes = logs.reduce((acc, current) => acc + current.durationMinutes, 0);
  const chartData = analyticsByDays();
  const statBreakdown = statusRatio();

  return (
    <div className="min-h-screen bg-[#fafafb] selection:bg-neutral-200">
      
      {/* Visual App Bar Header */}
      <header className="border-b border-neutral-100 bg-white shadow-xs sticky top-0 z-40 no-print">
        <div className="max-w-7xl mx-auto px-4 py-3 sm:px-6 lg:px-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-neutral-900 border border-neutral-800 p-2 rounded-xl text-white shadow-md">
              <Dog className="w-5 h-5 text-[#f1ecd1]" aria-hidden="true" />
            </div>
            <div>
              <h1 className="font-display font-bold text-lg tracking-tight text-neutral-900">
                PawsPilot
              </h1>
              <p className="text-[11px] font-mono text-neutral-400 tracking-wider uppercase">
                Deterministic Hands-Free Dog Tracker
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Quick Export Trigger actions */}
            <div className="hidden md:flex items-center gap-1 bg-neutral-50 px-2 py-1 rounded-lg border border-neutral-100 mr-2 text-xs font-mono text-neutral-500">
              <Trophy className="w-3.5 h-3.5 text-yellow-600 mr-1" />
              <span>{logs.length} sessions logged</span>
            </div>

            <button 
              onClick={handleExportCSV}
              title="Download Excel spreadsheet"
              className="p-2 cursor-pointer bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded-lg text-xs flex items-center gap-1.5 transition-colors font-medium border border-neutral-200"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">CSV Export</span>
            </button>

            <button 
              onClick={() => setShowMarkdownModal(true)}
              title="View full markdown progress summary"
              className="p-2 cursor-pointer bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded-lg text-xs flex items-center gap-1.5 transition-colors font-medium border border-neutral-200"
            >
              <FileText className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Markdown Report</span>
            </button>

            <button 
              onClick={() => setShowPrintPreviewModal(true)}
              title="Launch executive printable PDF view"
              className="p-2 cursor-pointer bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg text-xs flex items-center gap-1.5 transition-all font-medium"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Printable PDF</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container Layout */}
      <main className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-12 gap-6 no-print">
        
        {/* LEFT COLUMN: Profile management + Training Stats Dashboard (7/12 width) */}
        <div className="lg:col-span-7 space-y-6">

          {/* SECTION 1: Pet Profile Widget */}
          <div className="bg-white border border-neutral-200/80 rounded-2xl p-5 shadow-xs relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#faf9f5] rounded-full -mr-16 -mt-16 pointer-events-none border border-[#eee]" />
            <div className="flex items-start justify-between relative z-10">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-neutral-100 border-2 border-neutral-200 rounded-xl flex items-center justify-center text-3xl font-bold font-display shadow-xs text-neutral-800">
                  🐕
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="font-display font-bold text-xl text-neutral-900">{profile.name}</h2>
                    <span className="bg-neutral-100 border border-neutral-200 text-neutral-700 font-mono text-[10px] px-2 py-0.5 rounded-full">
                      {profile.breed}
                    </span>
                  </div>
                  <div className="text-xs text-neutral-500 mt-0.5 space-x-3">
                    <span><strong>Born:</strong> {new Date(profile.birthdate).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                    <span>•</span>
                    <span><strong>Weight:</strong> {profile.weight} lbs</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setIsEditingProfile(!isEditingProfile)}
                className="text-xs font-medium text-neutral-600 hover:text-neutral-900 flex items-center gap-1 px-3 py-1.5 rounded-lg hover:bg-neutral-50 border border-neutral-200 cursor-pointer"
              >
                <Edit2 className="w-3 h-3" />
                <span>Edit Profile</span>
              </button>
            </div>

            {/* Profile editor panel */}
            {isEditingProfile && (
              <div className="mt-4 pt-4 border-t border-neutral-100">
                <form onSubmit={handleSaveProfile} className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div className="sm:col-span-1">
                    <label className="block text-[10px] font-mono text-neutral-400 uppercase tracking-wider mb-1">Dog Name</label>
                    <input 
                      type="text" 
                      value={profileName} 
                      onChange={(e) => setProfileName(e.target.value)}
                      className="w-full text-xs font-medium px-2.5 py-1.5 bg-neutral-50 border border-neutral-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-neutral-400"
                    />
                  </div>
                  <div className="sm:col-span-1">
                    <label className="block text-[10px] font-mono text-neutral-400 uppercase tracking-wider mb-1">Breed</label>
                    <select 
                      value={profileBreed} 
                      onChange={(e) => setProfileBreed(e.target.value)}
                      className="w-full text-xs font-medium px-2.5 py-1.5 bg-neutral-50 border border-neutral-200 rounded-lg focus:outline-none"
                    >
                      {AVAILABLE_BREEDS.map((breed) => (
                        <option key={breed} value={breed}>{breed}</option>
                      ))}
                    </select>
                  </div>
                  <div className="sm:col-span-1">
                    <label className="block text-[10px] font-mono text-neutral-400 uppercase tracking-wider mb-1">Birth Date</label>
                    <input 
                      type="date" 
                      value={profileBirthdate} 
                      onChange={(e) => setProfileBirthdate(e.target.value)}
                      className="w-full text-xs font-mono px-2.5 py-1.5 bg-neutral-50 border border-neutral-200 rounded-lg focus:outline-none"
                    />
                  </div>
                  <div className="sm:col-span-1">
                    <label className="block text-[10px] font-mono text-neutral-400 uppercase tracking-wider mb-1">Weight (lbs)</label>
                    <input 
                      type="number" 
                      value={profileWeight} 
                      onChange={(e) => setProfileWeight(Number(e.target.value))}
                      className="w-full text-xs px-2.5 py-1.5 bg-neutral-50 border border-neutral-200 rounded-lg focus:outline-none"
                    />
                  </div>
                  <div className="sm:col-span-4 flex justify-end gap-2 mt-1">
                    <button 
                      type="button" 
                      onClick={() => setIsEditingProfile(false)}
                      className="px-3 py-1.5 text-xs text-neutral-500 hover:text-neutral-700"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit" 
                      className="px-3 py-1.5 bg-neutral-900 text-white rounded-lg text-xs font-medium hover:bg-neutral-800 flex items-center gap-1 cursor-pointer"
                    >
                      <Save className="w-3.5 h-3.5" />
                      Save
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* List goals in nice badges */}
            <div className="mt-4 pt-4 border-t border-neutral-100/70">
              <h3 className="text-xs font-mono font-semibold uppercase tracking-wider text-neutral-400 mb-2">Primary Training Objectives</h3>
              <div className="space-y-1.5">
                {profile.goals.map((goal, idx) => (
                  <div key={idx} className="flex items-center justify-between bg-neutral-50 border border-neutral-100 pl-3 pr-2 py-1.5 rounded-lg text-xs text-neutral-700">
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-neutral-400" />
                      <span>{goal}</span>
                    </div>
                    <button 
                      onClick={() => handleRemoveGoal(idx)}
                      className="text-neutral-400 hover:text-red-500 transition-colors px-1 cursor-pointer"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
              <form onSubmit={handleAddGoal} className="mt-2.5 flex gap-2">
                <input 
                  type="text" 
                  placeholder="Create active goal (e.g. Master loose-leash walk)" 
                  value={newGoal}
                  onChange={(e) => setNewGoal(e.target.value)}
                  className="flex-1 text-xs px-3 py-1.5 bg-white border border-neutral-200 rounded-lg text-neutral-700 placeholder:text-neutral-400 focus:outline-none focus:ring-1 focus:ring-neutral-400"
                />
                <button 
                  type="submit"
                  className="px-3 py-1.5 bg-neutral-100 hover:bg-neutral-200 rounded-lg text-xs font-medium text-neutral-700 transition-colors border border-neutral-200 cursor-pointer flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> Add
                </button>
              </form>
            </div>
          </div>

          {/* TACTILE LOGGING PANEL: Designed for walkers to tap with one hand */}
          <div className="bg-[#fbfcff] border border-blue-100 rounded-2xl p-5 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-display font-semibold text-sm text-neutral-900 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                  Tactile Walk Companion
                </h3>
                <p className="text-[11px] text-neutral-400 font-mono mt-0.5">Quick single-tap logging for walks (Hands-free friendly)</p>
              </div>
              <span className="text-[10px] font-mono bg-blue-50 text-blue-700 border border-blue-100 px-2 py-0.5 rounded-md">
                1-Touch Log
              </span>
            </div>

            {/* Quick Button presets for rapid log registration */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
              {PRESET_SKILLS.slice(0, 4).map((skill) => (
                <button
                  key={skill}
                  onClick={() => {
                    setSelectedSkill(skill);
                    setQuickDuration(5);
                    setQuickStatus("success");
                    setQuickNotes(`Completed standard walker-route quick sit-command log on ${skill}.`);
                    // Create entry instantly
                    const instantLog: TrainingLog = {
                      id: "inst-" + Date.now(),
                      dogId: profile.id,
                      timestamp: new Date().toISOString(),
                      skill: skill,
                      status: "success",
                      durationMinutes: 5,
                      notes: `Logged Buster practicing ${skill} on today's walk route.`
                    };
                    setLogs(prev => [instantLog, ...prev]);
                    
                    const systemConfirmation: ChatMessage = {
                      id: "act-" + Date.now(),
                      sender: "assistant",
                      text: `Rapid trigger logged: practicing ${skill} for 5 mins (Status: Success). Entry recorded.`,
                      timestamp: new Date().toISOString()
                    };
                    setChatHistory(prev => [...prev, systemConfirmation]);
                    speakText(systemConfirmation.text);
                  }}
                  className="py-3 px-2 cursor-pointer border border-neutral-200 hover:border-blue-350 hover:bg-white text-center bg-[#f7f9fd] hover:shadow-xs rounded-xl transition-all duration-150 flex flex-col items-center justify-center gap-1 group"
                >
                  <span className="text-xl group-hover:scale-110 transition-transform">🎯</span>
                  <span className="text-xs font-semibold text-neutral-800">{skill}</span>
                  <span className="text-[9px] text-[#555] font-mono bg-neutral-100 border border-neutral-100 px-1.5 py-0.2 rounded">5m • Success</span>
                </button>
              ))}
            </div>

            {/* Manual precise logging form */}
            <form onSubmit={handleQuickAddLog} className="bg-white border border-neutral-200/80 rounded-xl p-4 mt-3 space-y-3 shadow-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[10px] font-mono text-neutral-400 uppercase tracking-wider mb-1">Select Command/Skill</label>
                  <select 
                    value={selectedSkill}
                    onChange={(e) => setSelectedSkill(e.target.value)}
                    className="w-full text-xs font-medium px-2.5 py-1.5 bg-neutral-50 border border-neutral-200 rounded-lg"
                  >
                    {PRESET_SKILLS.map((skill) => (
                      <option key={skill} value={skill}>{skill}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-mono text-neutral-400 uppercase tracking-wider mb-1">Duration (Minutes)</label>
                  <div className="flex items-center gap-2">
                    <input 
                      type="range" 
                      min="1" 
                      max="30" 
                      value={quickDuration}
                      onChange={(e) => setQuickDuration(Number(e.target.value))}
                      className="flex-1 cursor-pointer"
                    />
                    <span className="text-xs font-mono font-semibold bg-neutral-100 border border-neutral-200 px-1.5 py-0.5 rounded text-neutral-700">
                      {quickDuration}m
                    </span>
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-mono text-neutral-400 uppercase tracking-wider mb-1">Performance Rating</label>
                  <select 
                    value={quickStatus}
                    onChange={(e) => setQuickStatus(e.target.value as LogStatus)}
                    className="w-full text-xs font-semibold px-2.5 py-1.5 bg-neutral-50 border border-neutral-200 rounded-lg text-neutral-850"
                  >
                    <option value="success" className="text-emerald-700 font-semibold">Success (Excellent)</option>
                    <option value="in_progress" className="text-amber-750 font-semibold">In Progress (Decent)</option>
                    <option value="needs_work" className="text-rose-700 font-semibold">Needs Work (Difficult)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-mono text-neutral-400 uppercase tracking-wider mb-1">Logs & Notes Diary (Optional)</label>
                <input 
                  type="text" 
                  placeholder="Describe distraction level, behavior metrics..." 
                  value={quickNotes}
                  onChange={(e) => setQuickNotes(e.target.value)}
                  className="w-full text-xs px-3 py-1.5 bg-neutral-50 border border-neutral-200 rounded-lg"
                />
              </div>

              <div className="flex justify-end pt-1">
                <button 
                  type="submit"
                  className="px-4 py-1.5 bg-neutral-900 border border-neutral-800 text-[#fcfcfc] font-medium rounded-lg text-xs hover:bg-neutral-850 flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 dark:text-[#f1ecd1]" /> Register Training Log
                </button>
              </div>
            </form>
          </div>

          {/* SECTION 3: Dynamic Custom SVG Analytics & Progress Visualization Charts */}
          <div className="bg-white border border-neutral-200/85 rounded-2xl p-5 shadow-xs">
            <h3 className="font-display font-semibold text-sm text-neutral-900 mb-4">Dog Training Efficiency Metrics</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Chart 1: Minutes Trained Daily */}
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-400 block mb-3">Daily Training Minutes (Last 7 Days)</span>
                <div className="h-32 flex items-end gap-3.5 pt-4 px-2 border-b border-l border-neutral-100 relative">
                  
                  {/* Background grid indicators */}
                  <div className="absolute left-0 right-0 top-1/4 border-t border-neutral-50 pointer-events-none" />
                  <div className="absolute left-0 right-0 top-2/4 border-t border-neutral-50 pointer-events-none" />
                  <div className="absolute left-0 right-0 top-3/4 border-t border-neutral-50 pointer-events-none" />

                  {chartData.days.map((day, dIdx) => {
                    const heightPercent = Math.min((day.minutes / chartData.max) * 100, 100);
                    return (
                      <div key={dIdx} className="flex-1 flex flex-col items-center group relative cursor-pointer">
                        <div className="text-[9px] font-mono font-bold text-neutral-500 group-hover:text-neutral-900 mb-1 transition-colors">
                          {day.minutes > 0 ? `${day.minutes}m` : "-"}
                        </div>
                        <div 
                          className="w-full bg-neutral-800 group-hover:bg-neutral-950 rounded-t-xs transition-all duration-300 relative shadow-sm"
                          style={{ height: `${Math.max(heightPercent, 4)}%` }}
                        >
                          <div className="opacity-0 group-hover:opacity-100 absolute -top-8 left-1/2 -translate-x-1/2 bg-neutral-900 text-white text-[9px] px-1 py-0.5 rounded shadow-md whitespace-nowrap pointer-events-none transition-opacity">
                            {day.minutes} Training Minutes
                          </div>
                        </div>
                        <div className="text-[10px] font-mono text-neutral-400 mt-2 font-medium">
                          {day.label}
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="flex justify-between text-[10px] font-mono text-neutral-400 mt-3.5 px-1">
                  <span><strong>Cumulative Progress:</strong> {totalTrainingMinutes} min</span>
                  <span><strong>Daily Cap:</strong> {chartData.max}m</span>
                </div>
              </div>

              {/* Chart 2: Skill Status Ratios */}
              <div className="flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-400 block mb-2">Performance Rating Index</span>
                  <div className="flex items-center gap-1.5 h-6 w-full rounded-lg overflow-hidden bg-neutral-100 my-4 shadow-sm border border-neutral-200/50">
                    <div 
                      style={{ width: `${statBreakdown.success || 33}%` }} 
                      title={`Success: ${statBreakdown.successCount}`}
                      className="bg-emerald-600 h-full transition-all duration-300" 
                    />
                    <div 
                      style={{ width: `${statBreakdown.progress || 33}%` }} 
                      title={`In progress: ${statBreakdown.progressCount}`}
                      className="bg-amber-500 h-full transition-all duration-300" 
                    />
                    <div 
                      style={{ width: `${statBreakdown.work || 33}%` }} 
                      title={`Needs work: ${statBreakdown.workCount}`}
                      className="bg-rose-500 h-full transition-all duration-300" 
                    />
                  </div>
                </div>

                <div className="space-y-2 text-xs font-medium">
                  <div className="flex items-center justify-between text-neutral-700">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 block" />
                      <span>Success (Excellent/Flawless)</span>
                    </div>
                    <span className="font-mono">{statBreakdown.successCount} ({statBreakdown.success}%)</span>
                  </div>
                  <div className="flex items-center justify-between text-neutral-700">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-500 block" />
                      <span>In Progress (Decent response)</span>
                    </div>
                    <span className="font-mono">{statBreakdown.progressCount} ({statBreakdown.progress}%)</span>
                  </div>
                  <div className="flex items-center justify-between text-neutral-700">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-500 block" />
                      <span>Needs Work (Needs reinforcement)</span>
                    </div>
                    <span className="font-mono">{statBreakdown.workCount} ({statBreakdown.work}%)</span>
                  </div>
                </div>

              </div>

            </div>
          </div>

          {/* SECTION 4: Historic Activity Logs Detail View */}
          <div className="bg-white border border-neutral-200 rounded-2xl overflow-hidden shadow-xs">
            <div className="px-5 py-4 border-b border-neutral-100 flex items-center justify-between">
              <div>
                <h3 className="font-display font-semibold text-sm text-neutral-900">Training Activity Reports</h3>
                <p className="text-[10px] text-neutral-400 font-mono">Detailed record of and past feedback notes</p>
              </div>
              <span className="text-xs bg-neutral-100 text-neutral-600 font-mono px-2.5 py-1 rounded">
                Total {logs.length}
              </span>
            </div>

            <div className="divide-y divide-neutral-100 max-h-80 overflow-y-auto">
              {logs.length === 0 ? (
                <div className="p-8 text-center text-neutral-400 text-xs font-mono">
                  No logged activities inside local systems. Converse or use tactile buttons to add one.
                </div>
              ) : (
                logs.map((log) => {
                  const isSuccess = log.status === "success";
                  const isProgress = log.status === "in_progress";
                  return (
                    <div key={log.id} className="p-4 flex items-start justify-between gap-4 group hover:bg-neutral-50/50 transition-colors">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-display font-semibold text-xs text-neutral-800">
                            {log.skill}
                          </span>
                          <span className="text-[10px] font-mono text-neutral-400">
                            {new Date(log.timestamp).toLocaleDateString()} at {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          <span className={`text-[9px] font-mono px-2 py-0.2 rounded-full border ${
                            isSuccess 
                              ? "bg-emerald-50 border-emerald-100 text-emerald-800"
                              : isProgress
                              ? "bg-amber-50 border-amber-100 text-amber-800"
                              : "bg-rose-50 border-rose-100 text-rose-800"
                          }`}>
                            {log.status.toUpperCase().replace("_", " ")}
                          </span>
                          <span className="text-[10px] bg-neutral-100 font-mono text-neutral-500 px-1.5 py-0.2 rounded">
                            {log.durationMinutes} mins
                          </span>
                        </div>
                        <p className="text-xs text-neutral-600 pl-1 leading-relaxed">
                          {log.notes}
                        </p>
                      </div>
                      <button 
                        onClick={() => handleDeleteLog(log.id)}
                        className="p-1 text-neutral-400 hover:text-red-500 transition-colors border border-transparent rounded cursor-pointer"
                        title="Delete log entry permanently"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* SECTION 5: Behavioral Milestones Ledger */}
          <div className="bg-white border border-neutral-200 rounded-2xl overflow-hidden shadow-xs">
            <div className="px-5 py-4 border-b border-neutral-100 flex items-center justify-between">
              <div>
                <h3 className="font-display font-semibold text-sm text-neutral-900 flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-emerald-600" />
                  Milestone Achievement Board
                </h3>
                <p className="text-[10px] text-neutral-400 font-mono">Record great leaps in behavioral maturation</p>
              </div>
            </div>

            <div className="p-4 space-y-4">
              <form onSubmit={handleAddMilestone} className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-neutral-50 p-3 rounded-xl border border-neutral-100 shadow-2xs">
                <div>
                  <label className="block text-[10px] font-mono text-neutral-400 uppercase tracking-wider mb-1">Milestone Name</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Mastered Housebroken status" 
                    value={newMilestoneTitle}
                    onChange={(e) => setNewMilestoneTitle(e.target.value)}
                    className="w-full text-xs px-3 py-1.5 bg-white border border-neutral-200 rounded-lg text-neutral-700"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-mono text-neutral-400 uppercase tracking-wider mb-1">Notes & Details</label>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      placeholder="e.g. No indoor incidents for 2 weeks" 
                      value={newMilestoneNotes}
                      onChange={(e) => setNewMilestoneNotes(e.target.value)}
                      className="flex-1 text-xs px-3 py-1.5 bg-white border border-neutral-200 rounded-lg text-neutral-700"
                    />
                    <button 
                      type="submit"
                      className="px-3 py-1.5 bg-neutral-900 text-white rounded-lg text-xs font-semibold hover:bg-neutral-800 transition-colors cursor-pointer"
                    >
                      Log
                    </button>
                  </div>
                </div>
              </form>

              {/* Achievements visual cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
                {milestones.length === 0 ? (
                  <div className="sm:col-span-2 text-center py-6 text-xs text-neutral-400 font-mono">
                    No milestone trophies generated. Record them above or via voice.
                  </div>
                ) : (
                  milestones.map((m) => (
                    <div key={m.id} className="border border-neutral-100 bg-[#f9fdfa] rounded-xl p-3.5 flex justify-between gap-3 relative overflow-hidden group hover:border-[#dfede1] transition-all">
                      <div className="absolute top-0 right-0 w-8 h-8 bg-emerald-50 rounded-full flex items-center justify-center -mr-3 -mt-3 border border-emerald-100" />
                      <div>
                        <div className="flex items-center gap-1 text-xs font-bold text-neutral-800 font-display">
                          <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span>{m.title}</span>
                        </div>
                        <span className="text-[9px] font-mono text-neutral-400 block mt-0.5">
                          Earned: {new Date(m.dateEarned).toLocaleDateString()}
                        </span>
                        <p className="text-xs text-neutral-600 mt-1.5 leading-relaxed italic">
                          "{m.notes}"
                        </p>
                      </div>
                      <button 
                        onClick={() => handleDeleteMilestone(m.id)}
                        className="text-neutral-400 hover:text-red-500 font-bold text-sm h-6 px-1.5 self-start cursor-pointer border border-transparent rounded mt-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Delete milestone permanently"
                      >
                        ×
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* SECTION 6: Data Backup, Import & System Control */}
          <div className="bg-white border border-neutral-200 rounded-2xl p-5 shadow-xs">
            <h3 className="font-display font-semibold text-sm text-neutral-900 mb-2">Private Storage & Restore</h3>
            <p className="text-xs text-neutral-500 mb-4">
              All pet behavioral logs live exclusively in your browser storage. You can back up or load a diagnostic backup JSON file below.
            </p>

            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-3">
                <button 
                  onClick={handleExportJSON}
                  className="px-3 py-1.5 bg-neutral-100 border border-neutral-200 hover:bg-neutral-200 text-neutral-700 text-xs font-medium rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" /> Export Diagnostic JSON
                </button>
                <span className="text-neutral-300">|</span>
                <span className="text-[10px] font-mono text-neutral-400 uppercase tracking-wider">Restore Database</span>
              </div>

              <div className="space-y-2">
                <textarea 
                  rows={2}
                  placeholder="Paste backup json string here..."
                  value={importJsonText}
                  onChange={(e) => setImportJsonText(e.target.value)}
                  className="w-full text-xs font-mono p-3 bg-neutral-50 border border-neutral-200 rounded-lg placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-neutral-400 focus:bg-white"
                />
                
                {importStatus && (
                  <p className="text-xs font-semibold text-blue-700 font-mono bg-blue-50 border border-blue-100 p-2 rounded-lg">
                    {importStatus}
                  </p>
                )}

                <div className="flex justify-end">
                  <button 
                    onClick={handleImportJSONAction}
                    className="px-3.5 py-1.5 bg-neutral-900 border border-neutral-800 text-white rounded-lg text-xs font-semibold hover:bg-neutral-850 flex items-center gap-1 transition-all cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5 dark:text-[#f1ecd1]" /> Import Parse & Restructure JSON
                  </button>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: EVE Interactive Chatbot (5/12 width) */}
        <div className="lg:col-span-5 flex flex-col h-[calc(100vh-100px)] lg:sticky lg:top-[74px]">
          
          <div className="bg-white border border-neutral-200 rounded-2xl shadow-xs flex-1 flex flex-col overflow-hidden">
            
            {/* Chat Header */}
            <div className="px-4 py-3.5 border-b border-neutral-100 flex items-center justify-between bg-neutral-50/50">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-neutral-600 animate-pulse" />
                <div>
                  <h3 className="font-display font-semibold text-xs text-neutral-800">EVE</h3>
                  <p className="text-[9px] font-mono text-neutral-400 uppercase tracking-wider">AI Speech & Command Parser</p>
                </div>
              </div>

              {/* TTS Readout Switch Toggle */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsTtsActive(!isTtsActive)}
                  title={isTtsActive ? "Mute automatic Speech synthesis readout" : "Read assistant chats out loud automatically during training"}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-medium cursor-pointer transition-all border ${
                    isTtsActive 
                      ? "bg-blue-50 border-blue-200 text-blue-700 font-semibold" 
                      : "bg-neutral-100 border-neutral-200 text-neutral-600 hover:bg-neutral-200"
                  }`}
                >
                  {isTtsActive ? <Volume2 className="w-3.5 h-3.5 text-blue-600" /> : <VolumeX className="w-3.5 h-3.5 text-neutral-500" />}
                  <span>Voice TTS</span>
                </button>
              </div>
            </div>

            {/* Chat messaging display screen */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-neutral-50/30">
              {chatHistory.map((msg) => {
                const isUser = msg.sender === "user";
                return (
                  <div 
                    key={msg.id} 
                    className={`flex ${isUser ? "justify-end" : "justify-start"} animate-fadeIn`}
                  >
                    <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-xs ${
                      isUser 
                        ? "bg-neutral-850 text-white rounded-br-none font-medium shadow-sm" 
                        : "bg-white border border-neutral-200 text-neutral-800 rounded-bl-none shadow-2xs leading-relaxed"
                    }`}>
                      <div>{msg.text}</div>
                      
                      {/* Show visual indicators for parsed training events inside chatbot bubble */}
                      {msg.parsedActionLog && msg.parsedActionLog.loggedType !== "none" && (
                        <div className="mt-2.5 pt-2 border-t border-dotted border-neutral-200 text-[10px] font-mono text-neutral-500 space-y-1">
                          <p className="text-emerald-700 font-bold flex items-center gap-1 font-sans">
                            <CheckCircle2 className="w-3 h-3" /> Securely Parsed & Saved Logs:
                          </p>
                          <div className="bg-neutral-50 p-1.5 rounded border border-neutral-100">
                            {msg.parsedActionLog.loggedType === "training" ? (
                              <>
                                <div>• <strong>Skill:</strong> {msg.parsedActionLog.details.skill}</div>
                                <div>• <strong>Duration:</strong> {msg.parsedActionLog.details.durationMinutes || 5} minutes</div>
                                <div>• <strong>Rating:</strong> {msg.parsedActionLog.details.status}</div>
                                <div>• <strong>Notes:</strong> {msg.parsedActionLog.details.notes}</div>
                              </>
                            ) : (
                              <>
                                <div>• <strong>Milestone:</strong> {msg.parsedActionLog.details.title}</div>
                                <div>• <strong>Notes:</strong> {msg.parsedActionLog.details.notes}</div>
                              </>
                            )}
                          </div>
                        </div>
                      )}

                      <span className={`text-[8px] font-mono block mt-1 text-right ${isUser ? "text-neutral-400" : "text-neutral-400"}`}>
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                );
              })}

              {isAiLoading && (
                <div className="flex justify-start">
                  <div className="bg-white border border-neutral-200 rounded-2xl rounded-bl-none px-4 py-3 text-xs text-neutral-500 shadow-2xs flex items-center gap-2 animate-pulse">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-neutral-600" />
                    <span>Analyzing verbal parameters...</span>
                  </div>
                </div>
              )}

              {/* Anchor for automatic scroll */}
              <div ref={chatBottomRef} />
            </div>

            {/* Simulated dictation sound wave */}
            {isListening && (
              <div className="bg-blue-50 border-t border-b border-blue-100/50 py-2.5 px-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="flex h-3 w-3 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
                  </span>
                  <span className="text-[11px] font-mono text-blue-700 font-semibold uppercase tracking-wider">Listening to Walker Voice...</span>
                </div>
                {/* Simulated ambient voice bars */}
                <div className="flex gap-0.5 items-end h-4">
                  <div className="w-0.5 bg-blue-500 rounded-full h-1 animate-pulse" />
                  <div className="w-0.5 bg-blue-500 rounded-full h-3 animate-pulse" />
                  <div className="w-0.5 bg-blue-500 rounded-full h-2 animate-pulse" />
                  <div className="w-0.5 bg-blue-500 rounded-full h-4 animate-pulse" />
                  <div className="w-0.5 bg-blue-500 rounded-full h-1 animate-pulse" />
                </div>
              </div>
            )}

            {/* Chat Input form triggers */}
            <div className="p-3 border-t border-neutral-100 bg-white">
              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendChat();
                }} 
                className="flex items-center gap-2"
              >
                {/* Microphone trigger for dictation */}
                {speechRecognitionSupported ? (
                  <button
                    type="button"
                    onClick={toggleListening}
                    title={isListening ? "Stop hands-free voice listen dictation" : "Active hands-free microphone walk dictation"}
                    className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
                      isListening 
                        ? "bg-blue-600 border-blue-600 text-white animate-pulse" 
                        : "bg-neutral-50 hover:bg-neutral-100 border-neutral-200 text-neutral-700"
                    }`}
                  >
                    {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled
                    title="Web speech client module unavailable in current preview frame mode"
                    className="p-2.5 rounded-xl bg-neutral-100 border border-neutral-200 text-neutral-400 cursor-not-allowed"
                  >
                    <MicOff className="w-4 h-4" />
                  </button>
                )}

                <input 
                  type="text" 
                  placeholder={isListening ? "Dictating your speech..." : "Say: 'I trained Sit today for 6 mins went decent'"}
                  value={userText}
                  onChange={(e) => setUserText(e.target.value)}
                  className="flex-1 text-xs px-3.5 py-2.5 bg-neutral-50 hover:bg-neutral-50/70 border border-neutral-200 rounded-xl leading-relaxed focus:outline-none focus:ring-1 focus:ring-neutral-400 focus:bg-white"
                />

                <button 
                  type="submit"
                  disabled={!userText.trim() && !isAiLoading}
                  className="px-4 py-2.5 bg-neutral-900 border border-neutral-800 disabled:opacity-50 text-[#fcfcfc] text-xs font-semibold rounded-xl hover:bg-neutral-850 flex items-center gap-1 cursor-pointer transition-colors"
                >
                  Confirm <ArrowRight className="w-3.5 h-3.5 text-neutral-400" />
                </button>
              </form>
              
              <div className="flex items-center justify-between text-[10px] text-neutral-400 font-mono mt-2 px-1">
                <span>💬 Supports natural speech commands</span>
                <span>Press <strong>Enter</strong> to evaluate</span>
              </div>
            </div>

          </div>

        </div>

      </main>

      {/* MODAL 1: Display Markdown Progress Summary Report */}
      {showMarkdownModal && (
        <div className="fixed inset-0 bg-neutral-900/60 flex items-center justify-center p-4 z-50 animate-fadeIn no-print">
          <div className="bg-white rounded-2xl w-full max-w-2xl border border-neutral-200 shadow-2xl flex flex-col max-h-[85vh]">
            <div className="px-5 py-4 border-b border-neutral-100 flex items-center justify-between">
              <div>
                <h3 className="font-display font-semibold text-sm text-neutral-900">Markdown Training Brief</h3>
                <p className="text-[10px] text-neutral-400 font-mono">Easily copyable formatted summary index sheets</p>
              </div>
              <button 
                onClick={() => setShowMarkdownModal(false)}
                className="text-neutral-400 hover:text-neutral-600 p-1 font-bold text-lg cursor-pointer"
              >
                ×
              </button>
            </div>

            <div className="p-4 overflow-y-auto flex-1 bg-neutral-50/30">
              <pre className="text-xs bg-white border border-neutral-200 rounded-xl p-4 font-mono text-neutral-700 whitespace-pre-wrap select-all overflow-x-auto">
                {generateMarkdownReport()}
              </pre>
            </div>

            <div className="p-3 border-t border-neutral-100 flex justify-end gap-2 bg-neutral-50/50">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(generateMarkdownReport());
                  alert("Report copied to system clipboard.");
                }}
                className="px-3.5 py-1.5 bg-neutral-905 bg-neutral-900 border border-neutral-800 hover:bg-neutral-850 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" /> Copy to Clipboard
              </button>
              <button
                onClick={() => setShowMarkdownModal(false)}
                className="px-3.5 py-1.5 border border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-700 rounded-lg text-xs font-medium cursor-pointer"
              >
                Close View
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: A beautiful print-ready PDF preview screen */}
      {showPrintPreviewModal && (
        <div className="fixed inset-0 bg-neutral-900/65 flex items-center justify-center p-4 z-50 overflow-y-auto animate-fadeIn no-print">
          <div className="bg-white rounded-2xl w-full max-w-3xl border border-neutral-200 shadow-2xl my-8 flex flex-col">
            
            {/* Modal headers */}
            <div className="px-5 py-4 border-b border-neutral-100 flex items-center justify-between">
              <div>
                <h3 className="font-display font-semibold text-sm text-neutral-900">Aesthetic Printable PDF Preview</h3>
                <p className="text-[10px] text-neutral-400 font-mono">Prints beautifully with specialized typography layout sheets</p>
              </div>
              <button 
                onClick={() => setShowPrintPreviewModal(false)}
                className="text-neutral-400 hover:text-neutral-600 p-1 font-bold text-lg cursor-pointer"
              >
                ×
              </button>
            </div>

            {/* Standard Printable Paper canvas */}
            <div className="p-8 bg-neutral-50 max-h-[70vh] overflow-y-auto">
              
              {/* Paper Layout */}
              <div id="printable-area" className="bg-white p-8 border border-neutral-200/60 rounded-xl shadow-xs text-neutral-800 space-y-6">
                
                {/* Header inside paper */}
                <div className="flex justify-between items-start border-b pb-4 border-neutral-100">
                  <div>
                    <h1 className="font-display font-bold text-2xl text-neutral-900 tracking-tight">PawsPilot Behavioral Report</h1>
                    <p className="text-xs text-neutral-500 mt-1">Generated progress dashboard and behavioral diagnostic ledger</p>
                    <div className="text-xs font-mono text-neutral-400 mt-2">
                       Report Date: {new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
                    </div>
                  </div>
                  <div className="p-3 bg-neutral-50 border rounded-lg text-center font-mono">
                    <span className="text-xl">🐕</span>
                    <span className="block text-[9px] font-bold text-neutral-400 uppercase mt-0.5">Paw Report</span>
                  </div>
                </div>

                {/* Patient Profile */}
                <div className="grid grid-cols-3 gap-4 bg-neutral-50/50 p-4 rounded-lg border border-neutral-150">
                  <div>
                    <span className="text-[9px] font-mono text-neutral-400 uppercase block">Pet Subject</span>
                    <strong className="text-sm font-display text-neutral-800">{profile.name}</strong>
                  </div>
                  <div>
                    <span className="text-[9px] font-mono text-neutral-400 uppercase block">Breed & Heritage</span>
                    <strong className="text-sm text-neutral-800">{profile.breed}</strong>
                  </div>
                  <div>
                    <span className="text-[9px] font-mono text-neutral-400 uppercase block font-medium">Recorded Weight</span>
                    <strong className="text-sm text-neutral-800">{profile.weight} lbs / Average</strong>
                  </div>
                </div>

                {/* Goals section */}
                <div className="space-y-2">
                  <h3 className="text-xs font-bold font-mono tracking-wider text-neutral-400 uppercase border-b pb-1">I. Formulated Training Mandates</h3>
                  <ul className="text-xs text-neutral-700 pl-4 list-decimal space-y-1">
                    {profile.goals.map((goal, idx) => (
                      <li key={idx}>{goal}</li>
                    ))}
                    {profile.goals.length === 0 && <li>No behavioral goals mapped.</li>}
                  </ul>
                </div>

                {/* Behavioral accomplishments milestones */}
                <div className="space-y-2">
                  <h3 className="text-xs font-bold font-mono tracking-wider text-neutral-400 uppercase border-b pb-1">II. Achieved behavioral landmarks</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    {milestones.map((m) => (
                      <div key={m.id} className="border border-neutral-100 p-3 rounded-lg bg-neutral-50">
                        <strong className="font-display font-semibold text-neutral-800">✅ {m.title}</strong>
                        <span className="text-[9px] font-mono text-neutral-400 block mt-0.5">Earned inside system: {new Date(m.dateEarned).toLocaleDateString()}</span>
                        <p className="text-neutral-600 mt-1 italic">"{m.notes}"</p>
                      </div>
                    ))}
                    {milestones.length === 0 && <p className="text-neutral-400 font-mono italic">No recorded milestone events verified.</p>}
                  </div>
                </div>

                {/* Exercise activity logs */}
                <div className="space-y-2">
                  <h3 className="text-xs font-bold font-mono tracking-wider text-neutral-400 uppercase border-b pb-1">III. Historical Exercise Records</h3>
                  <table className="w-full text-xs text-left border-collapse">
                    <thead>
                      <tr className="border-b border-neutral-200 bg-neutral-50/50">
                        <th className="py-2 px-3 font-mono text-neutral-500 uppercase tracking-wider">Date</th>
                        <th className="py-2 px-3 font-mono text-neutral-500 uppercase tracking-wider">Exercise Skill</th>
                        <th className="py-2 px-3 font-mono text-neutral-500 uppercase tracking-wider">Duration</th>
                        <th className="py-2 px-3 font-mono text-neutral-500 uppercase tracking-wider">Status Outcome</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-100">
                      {logs.map((log) => (
                        <tr key={log.id} className="hover:bg-neutral-50/30">
                          <td className="py-2 px-3 font-mono text-neutral-400">{new Date(log.timestamp).toLocaleDateString()}</td>
                          <td className="py-2 px-3 font-bold text-neutral-850">{log.skill}</td>
                          <td className="py-2 px-3 font-mono text-neutral-600">{log.durationMinutes} mins</td>
                          <td className="py-2 px-3">
                            <span className="uppercase text-[9px] font-bold tracking-wider">[{log.status}]</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Executive signature block */}
                <div className="pt-12 grid grid-cols-2 gap-12 text-xs border-t border-neutral-100">
                  <div className="space-y-4">
                    <div className="h-0.5 w-full bg-neutral-200" />
                    <span className="font-mono text-[9px] text-neutral-400 uppercase tracking-wider">Trainer/Owner endorsement: (Cole.Dowden@gmail.com)</span>
                  </div>
                  <div className="space-y-4">
                    <div className="h-0.5 w-full bg-neutral-200" />
                    <span className="font-mono text-[9px] text-neutral-400 uppercase tracking-wider text-right block">PawsPilot Diagnostic verification code</span>
                  </div>
                </div>

              </div>
            </div>

            {/* Print action bottom drawer bar */}
            <div className="p-3.5 border-t border-neutral-100 flex justify-end gap-2 bg-neutral-50">
              <button
                onClick={() => {
                  window.print();
                }}
                className="px-4 py-1.5 bg-neutral-900 border border-neutral-800 hover:bg-neutral-850 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                <Printer className="w-3.5 h-3.5" /> Initialize System Printing (PDF)
              </button>
              <button
                onClick={() => setShowPrintPreviewModal(false)}
                className="px-3.5 py-1.5 border border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-700 rounded-lg text-xs font-medium cursor-pointer"
              >
                Cancel & Return
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
