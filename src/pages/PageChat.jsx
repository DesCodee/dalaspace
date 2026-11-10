import { useState, useEffect, useRef } from "react";
import { MessageCircle, Mic, Send, MicOff, Volume2 } from "lucide-react";
import { useTheme } from "../contexts/ThemeContext";
import { AI_MODELS } from "../constants/config";
import { RNAME } from "../constants/regions";
import { askAiAssistant } from "../utils/aiService";

function renderMd(text) {
  if (!text) return text;
  return text.split("\n").map((line,j) => {
    const parts = []; let last=0; let k=0;
    const boldRx = /\*\*(.+?)\*\*/g; let match;
    while ((match=boldRx.exec(line))!==null) {
      if (match.index>last) parts.push(<span key={k++}>{line.slice(last,match.index)}</span>);
      parts.push(<strong key={k++} style={{fontWeight:700}}>{match[1]}</strong>);
      last=match.index+match[0].length;
    }
    if (last<line.length) parts.push(<span key={k++}>{line.slice(last)}</span>);
    if (parts.length===0) parts.push(<span key={0}>{line}</span>);
    return <span key={j}>{parts}<br/></span>;
  });
}
const stripMd = text => (text||"").replace(/\*\*/g,"").replace(/\*/g,"").replace(/#{1,6}\s?/g,"").replace(/[_~`]/g,"");

// По умолчанию Sonnet, если её нет в списке, то первая модель
const DEFAULT_MODEL = (AI_MODELS.find(m => m.id.includes("sonnet")) || AI_MODELS[0]).id;

export default function PageChat({ data, regions, selected, t, lang, userName }) {
  const { T } = useTheme();
  const [messages,  setMessages]  = useState([{role:"assistant",text:t.chatWelcome}]);
  const [input,     setInput]     = useState("");
  const [loading,   setLoading]   = useState(false);
  const [listening, setListening] = useState(false);
  const [speaking,  setSpeaking]  = useState(false);
  const [aiModel,   setAiModel]   = useState(DEFAULT_MODEL);
  const chatRef  = useRef(null);
  const recogRef = useRef(null);

  useEffect(() => { if (chatRef.current) chatRef.current.scrollTop=chatRef.current.scrollHeight; }, [messages]);

  const buildContext = () => {
    const lines = [];
    regions.forEach(r => {
      const d=data[r.id]; if (!d?.cur) return;
      lines.push(`${RNAME[r.id]?.[lang]||r.name}: t=${d.cur.temperature_2m?.toFixed(1)}°C, moisture=${(d.cur.soil_moisture_0_to_1cm*100).toFixed(1)}%, ndvi=${d.ndvi?.toFixed(2)}, rain7d=${d.p7}mm, et0=${d.et}mm/d, yield=${d.yieldScore}/100, risk=${d.risk}`);
    });
    return `You are DalaSpace AI assistant.${userName?" User's name: "+userName+".":""} Help farmers analyze agricultural data for Kazakhstan. Selected region: ${selected?(RNAME[selected.id]?.[lang]||selected.name):"none"}.\n\nLive data:\n${lines.join("\n")}\n\nRespond in same language as user. Be concise, practical. Use plain text, NO markdown.`;
  };

  const sendMessage = async (text) => {
    if (!text.trim()) return;
    const userMsg = {role:"user",text:text.trim()};
    setMessages(prev=>[...prev,userMsg]);
    setInput(""); setLoading(true);
    try {
      // Приветствие от ассистента в начале отбросится внутри askAiAssistant
      const history = [...messages,userMsg].slice(-12).map(m=>({role:m.role==="assistant"?"assistant":"user",content:m.text}));
      const reply = await askAiAssistant({
        text: text.trim(),
        history,
        systemPrompt: buildContext(),
        aiModel,
        selected,
        data,
        lang,
      });
      setMessages(prev=>[...prev,{role:"assistant",text:reply}]);
    } catch(e) {
      console.error("Ошибка чата:", e.message);
      setMessages(prev=>[...prev,{role:"assistant",text:"Не удалось получить ответ: "+e.message}]);
    }
    setLoading(false);
  };

  const toggleVoice = () => {
    if (listening) { recogRef.current?.stop(); setListening(false); return; }
    const SR = window.SpeechRecognition||window.webkitSpeechRecognition;
    if (!SR) return;
    const r = new SR();
    r.lang=lang==="kz"?"kk-KZ":lang==="en"?"en-US":"ru-RU";
    r.continuous=false; r.interimResults=false;
    r.onresult = e => { const tr=e.results[0][0].transcript; setInput(tr); setListening(false); setTimeout(()=>sendMessage(tr),300); };
    r.onerror = () => setListening(false);
    r.onend   = () => setListening(false);
    recogRef.current=r; r.start(); setListening(true);
  };

  const speakText = text => {
    if (speaking) { window.speechSynthesis.cancel(); setSpeaking(false); return; }
    const utter = new SpeechSynthesisUtterance(stripMd(text));
    const targetLang = lang==="kz"?"kk":lang==="en"?"en":"ru";
    utter.lang=lang==="kz"?"kk-KZ":lang==="en"?"en-US":"ru-RU";
    const voices=window.speechSynthesis.getVoices();
    const match=voices.find(v=>v.lang.startsWith(targetLang));
    if (match) utter.voice=match;
    utter.rate=0.95; utter.onend=()=>setSpeaking(false); utter.onerror=()=>setSpeaking(false);
    window.speechSynthesis.speak(utter); setSpeaking(true);
  };

  useEffect(() => { window.speechSynthesis?.getVoices(); }, []);

  return (
    <div className="chat-wrap" style={{display:"flex",flexDirection:"column",height:"calc(100dvh - 120px)",maxWidth:720,margin:"0 auto",width:"100%"}}>
      <div ref={chatRef} style={{flex:1,overflowY:"auto",padding:"16px 4px",display:"flex",flexDirection:"column",gap:12}}>
        <div style={{textAlign:"center",fontSize:11,color:T.dim,padding:"8px 0 12px"}}>{t.chatHint}</div>
        {messages.map((m,i) => (
          <div key={i} style={{display:"flex",flexDirection:"column",alignItems:m.role==="user"?"flex-end":"flex-start",animation:"enter 0.2s ease"}}>
            <div style={{maxWidth:"85%",padding:"12px 16px",borderRadius:16,background:m.role==="user"?T.leaf:(T.isDark?"rgba(255,255,255,0.06)":"rgba(0,0,0,0.04)"),color:m.role==="user"?(T.isDark?"#0a0c0e":"#fff"):T.fg,fontSize:13,lineHeight:1.65,borderBottomRightRadius:m.role==="user"?4:16,borderBottomLeftRadius:m.role==="user"?16:4}}>
              {renderMd(m.text)}
            </div>
            {m.role==="assistant"&&i>0&&(
              <button onClick={()=>speakText(m.text)} style={{marginTop:4,padding:"3px 10px",borderRadius:8,border:`1px solid ${T.brd}`,background:"transparent",color:T.dim,fontSize:10,cursor:"pointer",display:"flex",alignItems:"center",gap:4}}>
                <Volume2 size={11}/> {speaking?t.stopSpeak:t.speak}
              </button>
            )}
          </div>
        ))}
        {loading&&(
          <div style={{display:"flex",alignItems:"center",gap:8,padding:"8px 16px"}}>
            <div style={{width:8,height:8,borderRadius:"50%",background:T.leaf,animation:"blink 1s infinite"}}/>
            <span style={{fontSize:12,color:T.dim}}>DalaSpace AI…</span>
          </div>
        )}
      </div>

      <div style={{borderTop:`1px solid ${T.brd}`,paddingTop:8}}>
        <div style={{display:"flex",gap:4,marginBottom:8,flexWrap:"wrap",alignItems:"center",overflowX:"auto",paddingBottom:2}}>
          <span style={{fontSize:10,color:T.dim,marginRight:2,flexShrink:0}}>AI:</span>
          {AI_MODELS.map(m => (
            <button key={m.id} onClick={()=>setAiModel(m.id)} style={{padding:"3px 9px",borderRadius:8,border:`1px solid ${aiModel===m.id?(m.color||T.leaf):T.brd}`,background:aiModel===m.id?`${m.color||T.leaf}18`:"transparent",color:aiModel===m.id?(m.color||T.leaf):T.dim,fontSize:10,fontWeight:aiModel===m.id?700:500,cursor:"pointer",whiteSpace:"nowrap",display:"flex",alignItems:"center",gap:3,flexShrink:0}}>
              <span style={{fontSize:11}}>{m.badge}</span> {m.short}
            </button>
          ))}
        </div>

        <div style={{display:"flex",gap:8,alignItems:"center"}}>
          <button onClick={toggleVoice} style={{width:42,height:42,flexShrink:0,borderRadius:12,border:`1px solid ${listening?T.leaf:T.brd}`,background:listening?`${T.leaf}15`:T.controlBg,color:listening?T.leaf:T.sub,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",animation:listening?"blink 1s infinite":"none"}}>
            {listening?<MicOff size={18}/>:<Mic size={18}/>}
          </button>
          <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&!loading&&sendMessage(input)} placeholder={t.chatPlaceholder}
            style={{flex:1,minWidth:0,height:42,padding:"0 16px",borderRadius:12,border:`1px solid ${T.brd}`,background:T.isDark?"rgba(255,255,255,0.04)":"rgba(0,0,0,0.02)",color:T.fg,fontSize:13,outline:"none"}}
            onFocus={e=>e.target.style.borderColor=T.leaf} onBlur={e=>e.target.style.borderColor=T.brd}/>
          <button onClick={()=>!loading&&sendMessage(input)} disabled={loading||!input.trim()} style={{width:42,height:42,flexShrink:0,borderRadius:12,border:"none",background:input.trim()?T.leaf:T.controlBg,color:input.trim()?(T.isDark?"#0a0c0e":"#fff"):T.dim,cursor:input.trim()?"pointer":"default",display:"flex",alignItems:"center",justifyContent:"center"}}>
            <Send size={18}/>
          </button>
        </div>
      </div>
    </div>
  );
}