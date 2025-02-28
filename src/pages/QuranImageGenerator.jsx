import { useState, useEffect, useRef, useCallback } from "react";
import { useTheme } from "../context/ThemeContext";
import {
  FaDownload,
  FaMagic,
  FaQuestionCircle,
  FaTimes
} from "react-icons/fa";

/**
 * A helper function to wrap text for canvas drawing (right-to-left).
 */
function wrapTextRTL(text, ctx, maxWidth) {
  const words = text.split(" ");
  const lines = [];
  let currentLine = words[0] || "";

  for (let i = 1; i < words.length; i++) {
    const testLine = currentLine + " " + words[i];
    if (ctx.measureText(testLine).width > maxWidth) {
      lines.push(currentLine);
      currentLine = words[i];
    } else {
      currentLine = testLine;
    }
  }
  lines.push(currentLine);
  return lines;
}

export default function QuranImageGenerator() {
  const { theme } = useTheme();

  // ---------- Surahs & Ayahs ----------
  const [surahs, setSurahs] = useState([]);
  const [selectedSurah, setSelectedSurah] = useState(null);
  const [ayahs, setAyahs] = useState([]);
  const [selectedAyahs, setSelectedAyahs] = useState([]);
  const [loadingSurahs, setLoadingSurahs] = useState(false);
  const [loadingAyahs, setLoadingAyahs] = useState(false);

  // ---------- Draggable/Resizable Box ----------
  const [boxX, setBoxX] = useState(20);
  const [boxY, setBoxY] = useState(20);
  const [boxWidth, setBoxWidth] = useState(300);
  const [boxHeight, setBoxHeight] = useState(150);
  const [dragging, setDragging] = useState(false);
  const [resizing, setResizing] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [resizeOffset, setResizeOffset] = useState({ w: 0, h: 0 });
  const [isEditingText, setIsEditingText] = useState(false);

  // ---------- Text & Effects ----------
  const [displayText, setDisplayText] = useState("سيتم عرض الآيات هنا");
  const [fontSize, setFontSize] = useState(26);
  const [selectedFont, setSelectedFont] = useState("Amiri");
  const [fontColor, setFontColor] = useState("#000000");
  const [textEffect, setTextEffect] = useState("none"); // "none" | "outline" | "glow"
  const [shadowColor, setShadowColor] = useState("#ff0000");

  // ---------- Surah Info at Bottom ----------
  const [showAyahInfo, setShowAyahInfo] = useState(true);

  // ---------- Background ----------
  const [bgOption, setBgOption] = useState("solid"); // "solid" | "gradient"
  const [bgColor, setBgColor] = useState("#ffffff");
  const [gradStart, setGradStart] = useState("#f6d365");
  const [gradEnd, setGradEnd] = useState("#fda085");

  // ---------- Download / Aspect Ratio ----------
  const [downloadFormat, setDownloadFormat] = useState("png");
  const [aspectRatio, setAspectRatio] = useState("1:1");

  // ---------- Usage Modal ----------
  const [showUsageModal, setShowUsageModal] = useState(false);

  // ---------- Refs ----------
  const previewRef = useRef(null);
  const canvasRef = useRef(null);

  // ===========================
  // Fetch Surahs on mount
  // ===========================
  useEffect(() => {
    setLoadingSurahs(true);
    fetch("https://api.alquran.cloud/v1/surah")
      .then((res) => res.json())
      .then((data) => {
        setSurahs(data.data);
        setLoadingSurahs(false);
      })
      .catch((err) => {
        console.error("Error fetching surahs:", err);
        setLoadingSurahs(false);
      });
  }, []);

  // ===========================
  // Fetch Ayahs
  // ===========================
  useEffect(() => {
    if (!selectedSurah) {
      setAyahs([]);
      setSelectedAyahs([]);
      setDisplayText("سيتم عرض الآيات هنا");
      return;
    }
    setLoadingAyahs(true);
    fetch(
      `https://api.alquran.cloud/v1/surah/${selectedSurah.number}?edition=quran-uthmani`
    )
      .then((res) => res.json())
      .then((resp) => {
        const arr = resp?.data?.ayahs || [];
        setAyahs(arr);
        setLoadingAyahs(false);
        setSelectedAyahs([]);
        setDisplayText("سيتم عرض الآيات هنا");
      })
      .catch((err) => {
        console.error("Error fetching ayahs:", err);
        setLoadingAyahs(false);
      });
  }, [selectedSurah]);

  // ===========================
  // Build text from multi-ayah selection
  // ===========================
  useEffect(() => {
    if (!selectedAyahs.length) {
      setDisplayText("سيتم عرض الآيات هنا");
      return;
    }
    const lines = selectedAyahs.map((numInSurah) => {
      const found = ayahs.find((a) => a.numberInSurah === numInSurah);
      if (!found) return "";
      const sajdaIcon = found.sajda ? " 🕋" : "";
      // e.g. (2) text
      return `(${found.numberInSurah}) ${found.text}${sajdaIcon}`;
    });
    setDisplayText(lines.join("\n"));
  }, [selectedAyahs, ayahs]);

  // ===========================
  // Mouse / Drag / Resize
  // ===========================
  const handleMouseMove = useCallback(
    (e) => {
      if (!previewRef.current) return;
      if (dragging) {
        e.preventDefault();
        const previewRect = previewRef.current.getBoundingClientRect();
        let newX = e.clientX - previewRect.left - dragOffset.x;
        let newY = e.clientY - previewRect.top - dragOffset.y;
        // clamp
        newX = Math.max(0, Math.min(newX, previewRect.width - boxWidth));
        newY = Math.max(0, Math.min(newY, previewRect.height - boxHeight));
        setBoxX(newX);
        setBoxY(newY);
      } else if (resizing) {
        e.preventDefault();
        const previewRect = previewRef.current.getBoundingClientRect();
        const newW = e.clientX - previewRect.left - boxX - resizeOffset.w;
        const newH = e.clientY - previewRect.top - boxY - resizeOffset.h;
        const minDim = 40;
        const clampW = Math.max(minDim, Math.min(newW, previewRect.width - boxX));
        const clampH = Math.max(minDim, Math.min(newH, previewRect.height - boxY));
        setBoxWidth(clampW);
        setBoxHeight(clampH);
      }
    },
    [dragging, resizing, dragOffset, boxWidth, boxHeight, boxX, boxY, resizeOffset]
  );

  const handleMouseUp = useCallback(() => {
    setDragging(false);
    setResizing(false);
  }, []);

  useEffect(() => {
    if (dragging || resizing) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    } else {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    }
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [dragging, resizing, handleMouseMove, handleMouseUp]);

  const handleBoxMouseDown = (e) => {
    if (isEditingText) return;
    setDragging(true);
    const rect = e.currentTarget.getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  const handleResizeMouseDown = (e) => {
    e.stopPropagation();
    setResizing(true);
    setResizeOffset({
      w: boxWidth - (e.nativeEvent.offsetX ?? 0),
      h: boxHeight - (e.nativeEvent.offsetY ?? 0),
    });
  };

  const handleDoubleClick = () => {
    setIsEditingText(true);
  };
  const handleTextChange = (e) => {
    setDisplayText(e.target.value);
  };
  const finishEditingText = () => {
    setIsEditingText(false);
  };

  // ===========================
  // dynamic style for text effect in preview
  // ===========================
  let textShadowCSS = "none";
  if (textEffect === "outline") {
    // approximate outline around text with multiple shadows
    textShadowCSS = `
      1px 0 0 ${shadowColor},
      -1px 0 0 ${shadowColor},
      0 1px 0 ${shadowColor},
      0 -1px 0 ${shadowColor}
    `;
  } else if (textEffect === "glow") {
    textShadowCSS = `0 0 10px ${shadowColor}`;
  }

  // ===========================
  // aspect ratio
  // ===========================
  let previewW = 400;
  if (aspectRatio === "16:9") {
    previewW = 480;
  } else if (aspectRatio === "9:16") {
    previewW = 270;
  } else if (aspectRatio === "4:5") {
    previewW = 400;
  }
  // We'll let the preview container shrink on mobile by using maxWidth
  const containerStyle = {
    width: "100%",
    maxWidth: previewW,
    aspectRatio: aspectRatio.replace(":", "/"), // for modern browsers
  };

  // ===========================
  // Download
  // ===========================
  const handleDownload = () => {
    if (!previewRef.current || !canvasRef.current) return;
    const previewRect = previewRef.current.getBoundingClientRect();
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    // match the current displayed size
    canvas.width = previewRect.width;
    canvas.height = previewRect.height;

    // background
    if (bgOption === "solid") {
      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    } else {
      const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      grad.addColorStop(0, gradStart);
      grad.addColorStop(1, gradEnd);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    drawBoxText(ctx);
    if (showAyahInfo && selectedSurah && selectedAyahs.length) {
      drawSurahInfo(ctx, canvas.width, canvas.height);
    }

    const link = document.createElement("a");
    const mime = downloadFormat === "jpeg" ? "image/jpeg" : "image/png";
    const dataURL =
      downloadFormat === "jpeg"
        ? canvas.toDataURL(mime, 0.9)
        : canvas.toDataURL(mime);
    link.download = `quran_image.${downloadFormat}`;
    link.href = dataURL;
    link.click();
  };

  function drawBoxText(ctx) {
    ctx.save();
    ctx.translate(boxX, boxY);
    ctx.textAlign = "right";
    ctx.direction = "rtl";
    ctx.font = `${fontSize}px ${selectedFont}`;
    ctx.textBaseline = "top";

    if (textEffect === "outline") {
      ctx.fillStyle = fontColor;
      ctx.strokeStyle = shadowColor;
      ctx.lineWidth = 1.4;
      ctx.shadowColor = "transparent";
    } else if (textEffect === "glow") {
      ctx.fillStyle = fontColor;
      ctx.shadowColor = shadowColor;
      ctx.shadowBlur = 15;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;
    } else {
      ctx.fillStyle = fontColor;
      ctx.shadowColor = "transparent";
    }

    const padding = 6;
    const maxW = boxWidth - padding * 2;
    const lines = wrapTextRTL(displayText, ctx, maxW);
    const lineHeight = fontSize * 1.3;
    let yPos = padding;

    for (let ln of lines) {
      const xPos = boxWidth - padding; // because textAlign=right
      if (textEffect === "outline") {
        ctx.strokeText(ln, xPos, yPos);
      }
      ctx.fillText(ln, xPos, yPos);
      yPos += lineHeight;
      if (yPos > boxHeight - lineHeight) break;
    }
    ctx.restore();
  }

  function drawSurahInfo(ctx, cW, cH) {
    ctx.save();
    ctx.textBaseline = "bottom";
    ctx.direction = "rtl";
    ctx.textAlign = "right";
    const infoSize = Math.max(14, Math.floor(fontSize * 0.8));
    ctx.font = `${infoSize}px ${selectedFont}`;
    ctx.fillStyle = fontColor;
    ctx.shadowColor = "transparent";

    let label;
    if (selectedAyahs.length === 1) {
      label = `سُورَةُ ${selectedSurah.name} - الآية (${selectedAyahs[0]})`;
    } else {
      label = `سُورَةُ ${selectedSurah.name} - الآيات (${selectedAyahs.join(",")})`;
    }
    const xPos = cW - 10;
    const yPos = cH - 10;

    ctx.fillText(label, xPos, yPos);
    ctx.restore();
  }

  const handleRandomGradient = () => {
    setBgOption("gradient");
    const randHex = () =>
      Math.floor(Math.random() * 0xffffff).toString(16).padStart(6, "0");
    setGradStart("#" + randHex());
    setGradEnd("#" + randHex());
  };

  // ===========================
  // usage modal
  // ===========================
  const openUsageModal = () => setShowUsageModal(true);
  const closeUsageModal = () => setShowUsageModal(false);

  return (
    <div
      className={`min-h-screen ${
        theme === "dark" ? "bg-gray-900 text-white" : "bg-gray-50 text-black"
      } p-4`}
    >
      {/* Usage Modal */}
      {showUsageModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div
            className={`relative w-full max-w-xl mx-auto rounded-lg ${
              theme === "dark" ? "bg-gray-800" : "bg-white"
            } p-6 shadow-lg`}
          >
            <button
              onClick={closeUsageModal}
              className="absolute top-3 right-3 text-red-500 hover:text-red-600"
            >
              <FaTimes size={20} />
            </button>
            <h3 className="text-xl font-bold mb-4">دليل الاستخدام</h3>
            <ol className="list-decimal list-inside space-y-1">
              <li>اختر السورة من القائمة المنسدلة.</li>
              <li>اختر الآيات المراد تضمينها بالضغط مع <b>Ctrl</b> أو <b>Shift</b> لتحديد آيات متعددة.</li>
              <li>يمكنك سحب مربّع النص وتغيير حجمه بالنقر على الزاوية السفلية اليمنى.</li>
              <li>انقر مرتين (Double click) على مربّع النص لتعديل نصّه يدويًا.</li>
              <li>خصص الخط والتأثيرات والخلفية ونسبة العرض/الارتفاع.</li>
              <li>اضغط على زر <b>تحميل الصورة</b> لحفظها على جهازك.</li>
            </ol>
            <p className="mt-2 text-sm">
              على الأجهزة المحمولة، قد تحتاج إلى الضغط مطولاً قبل السحب.
            </p>
          </div>
        </div>
      )}

      <div className="flex flex-col items-center md:flex-row md:justify-between mb-6">
        <h2 className="text-2xl md:text-3xl font-bold mb-4 md:mb-0 text-center">
          مولد صورة قرآنية
        </h2>
        <button
          onClick={openUsageModal}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
        >
          <FaQuestionCircle />
          دليل الاستخدام
        </button>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Left Column: Controls */}
        <div>
          {/* Surah Selection */}
          <div className="mb-4">
            <label className="block mb-1 font-semibold">اختر السورة:</label>
            {loadingSurahs ? (
              <p>جاري تحميل السور...</p>
            ) : (
              <select
                className={`w-full p-2 border rounded ${
                  theme === "dark" ? "bg-gray-700" : "bg-white"
                }`}
                value={selectedSurah ? selectedSurah.number : ""}
                onChange={(e) => {
                  const val = +e.target.value;
                  const found = surahs.find((s) => s.number === val);
                  setSelectedSurah(found || null);
                }}
              >
                <option value="">-- اختر السورة --</option>
                {surahs.map((s) => (
                  <option key={s.number} value={s.number}>
                    {s.number}. {s.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Ayah Multi-Select */}
          {selectedSurah && (
            <div className="mb-4">
              <label className="block mb-1 font-semibold">
                اختر الآيات (استخدم Ctrl/Shift للتعدد):
              </label>
              {loadingAyahs ? (
                <p>جاري تحميل الآيات...</p>
              ) : (
                <select
                  multiple
                  size={8}
                  className={`w-full p-2 border rounded ${
                    theme === "dark" ? "bg-gray-700" : "bg-white"
                  }`}
                  value={selectedAyahs}
                  onChange={(e) => {
                    const arr = [...e.target.selectedOptions].map(
                      (opt) => +opt.value
                    );
                    setSelectedAyahs(arr);
                  }}
                >
                  {ayahs.map((a) => (
                    <option key={a.numberInSurah} value={a.numberInSurah}>
                      ({a.numberInSurah}) {a.text.slice(0, 40)}
                      {a.text.length > 40 ? "..." : ""}
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}

          {/* Font & Effects */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block mb-1 font-semibold">نوع الخط:</label>
              <select
                className={`w-full p-2 border rounded ${
                  theme === "dark" ? "bg-gray-700" : "bg-white"
                }`}
                value={selectedFont}
                onChange={(e) => setSelectedFont(e.target.value)}
              >
                <option value="Amiri">أميري (Amiri)</option>
                <option value="Reem Kufi">ريـم كوفي (Reem Kufi)</option>
                <option value="Lateef">لطيف (Lateef)</option>
                <option value="Scheherazade">شهرزاد (Scheherazade)</option>
                <option value="Cairo">كايرو (Cairo)</option>
                <option value="Tajawal">تجوال (Tajawal)</option>
                <option value="El Messiri">المسيري (El Messiri)</option>
              </select>
            </div>
            <div>
              <label className="block mb-1 font-semibold">حجم الخط (px):</label>
              <input
                type="number"
                className={`w-full p-2 border rounded ${
                  theme === "dark" ? "bg-gray-700" : "bg-white"
                }`}
                value={fontSize}
                onChange={(e) => {
                  const num = parseInt(e.target.value, 10);
                  setFontSize(num > 0 ? num : 26);
                }}
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block mb-1 font-semibold">لون الخط:</label>
              <input
                type="color"
                className="w-full p-2 border rounded"
                value={fontColor}
                onChange={(e) => setFontColor(e.target.value)}
              />
            </div>
            <div>
              <label className="block mb-1 font-semibold">تأثير النص:</label>
              <select
                className={`w-full p-2 border rounded ${
                  theme === "dark" ? "bg-gray-700" : "bg-white"
                }`}
                value={textEffect}
                onChange={(e) => setTextEffect(e.target.value)}
              >
                <option value="none">بدون تأثير</option>
                <option value="outline">حدود للنص</option>
                <option value="glow">توهّج للنص</option>
              </select>
            </div>
          </div>
          {textEffect !== "none" && (
            <div className="mb-4">
              <label className="block mb-1 font-semibold">
                لون {textEffect === "glow" ? "التوهّج" : "الحدود"}:
              </label>
              <input
                type="color"
                className="w-32 p-2 border rounded"
                value={shadowColor}
                onChange={(e) => setShadowColor(e.target.value)}
              />
            </div>
          )}

          {/* Show Surah Info */}
          {!!selectedAyahs.length && (
            <div className="mb-4">
              <label className="inline-flex items-center">
                <input
                  type="checkbox"
                  checked={showAyahInfo}
                  onChange={(e) => setShowAyahInfo(e.target.checked)}
                  className="mr-2"
                />
                عرض معلومات الآية في أسفل الصورة
              </label>
            </div>
          )}

          {/* Background */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block mb-1 font-semibold">الخلفية:</label>
              <select
                className={`w-full p-2 border rounded ${
                  theme === "dark" ? "bg-gray-700" : "bg-white"
                }`}
                value={bgOption}
                onChange={(e) => setBgOption(e.target.value)}
              >
                <option value="solid">لون ثابت</option>
                <option value="gradient">تدرج لوني</option>
              </select>
            </div>
            {bgOption === "solid" && (
              <div>
                <label className="block mb-1 font-semibold">
                  اختر اللون:
                </label>
                <input
                  type="color"
                  className="w-full p-2 border rounded"
                  value={bgColor}
                  onChange={(e) => setBgColor(e.target.value)}
                />
              </div>
            )}
            {bgOption === "gradient" && (
              <>
                <div>
                  <label className="block mb-1 font-semibold">
                    بداية التدرج:
                  </label>
                  <input
                    type="color"
                    className="w-full p-2 border rounded"
                    value={gradStart}
                    onChange={(e) => setGradStart(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block mb-1 font-semibold">
                    نهاية التدرج:
                  </label>
                  <input
                    type="color"
                    className="w-full p-2 border rounded"
                    value={gradEnd}
                    onChange={(e) => setGradEnd(e.target.value)}
                  />
                </div>
              </>
            )}
          </div>

          {/* Download + Ratio */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block mb-1 font-semibold">
                صيغة التنزيل:
              </label>
              <select
                className={`w-full p-2 border rounded ${
                  theme === "dark" ? "bg-gray-700" : "bg-white"
                }`}
                value={downloadFormat}
                onChange={(e) => setDownloadFormat(e.target.value)}
              >
                <option value="png">PNG</option>
                <option value="jpeg">JPEG</option>
              </select>
            </div>
            <div>
              <label className="block mb-1 font-semibold">
                نسبة العرض/الارتفاع:
              </label>
              <select
                className={`w-full p-2 border rounded ${
                  theme === "dark" ? "bg-gray-700" : "bg-white"
                }`}
                value={aspectRatio}
                onChange={(e) => setAspectRatio(e.target.value)}
              >
                <option value="1:1">مربّع (1:1)</option>
                <option value="16:9">وضع أفقي (16:9)</option>
                <option value="9:16">شاشة هاتف (9:16)</option>
                <option value="4:5">إنستغرام (4:5)</option>
              </select>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex flex-wrap gap-3">
            <button
              onClick={handleDownload}
              className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded hover:bg-teal-700"
            >
              <FaDownload />
              تحميل الصورة
            </button>
            <button
              onClick={handleRandomGradient}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
            >
              <FaMagic />
              خلفية عشوائية
            </button>
          </div>
        </div>

        {/* Right Column: Preview */}
        <div>
          <h3 className="text-xl font-bold mb-2">معاينة الصورة:</h3>
          <div
            ref={previewRef}
            className="mx-auto border border-gray-400 relative"
            style={containerStyle}
          >
            <div
              className="w-full h-full"
              style={{
                background:
                  bgOption === "solid"
                    ? bgColor
                    : `linear-gradient(135deg, ${gradStart}, ${gradEnd})`,
                position: "relative",
              }}
            >
              <div
                className="absolute bg-white bg-opacity-10 border border-blue-400"
                style={{
                  top: boxY,
                  left: boxX,
                  width: boxWidth,
                  height: boxHeight,
                  cursor: isEditingText ? "text" : "move",
                }}
                onMouseDown={handleBoxMouseDown}
                onDoubleClick={handleDoubleClick}
              >
                {isEditingText ? (
                  <textarea
                    autoFocus
                    className="w-full h-full p-2 bg-transparent text-black dark:text-white resize-none"
                    style={{
                      fontFamily: selectedFont,
                      fontSize: `${fontSize}px`,
                      direction: "rtl",
                      textAlign: "right",
                    }}
                    value={displayText}
                    onChange={handleTextChange}
                    onBlur={finishEditingText}
                  />
                ) : (
                  <div
                    className="w-full h-full p-2 overflow-auto whitespace-pre-wrap"
                    style={{
                      fontFamily: selectedFont,
                      fontSize: `${fontSize}px`,
                      color: fontColor,
                      direction: "rtl",
                      textAlign: "right",
                      textShadow: textShadowCSS,
                    }}
                  >
                    {displayText}
                  </div>
                )}
                {/* resize handle */}
                <div
                  className="absolute bg-blue-500 w-4 h-4 bottom-0 right-0 cursor-se-resize"
                  onMouseDown={handleResizeMouseDown}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Hidden Canvas for final output */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
