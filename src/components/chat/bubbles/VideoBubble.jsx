




import { useState, useRef, useEffect, useCallback } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize2 } from 'lucide-react';
import BaseBubble from './BaseBubble';
import { formatDuration } from '../../../utils/formatters';
import { useSelector } from 'react-redux';

const VideoPlayer = ({ url, fileName, fileSize, duration: msgDuration, isMe }) => {
const videoRef = useRef(null);
const wrapRef = useRef(null);

const [isPlaying, setIsPlaying] = useState(false);
const [isMuted, setIsMuted] = useState(false);
const [currentTime, setCurrentTime] = useState(0);
const [duration, setDuration] = useState(msgDuration || 0);
const [showControls, setShowControls] = useState(false);
const [isFullscreen, setIsFullscreen] = useState(false);
const [isLoaded, setIsLoaded] = useState(false);

const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

useEffect(() => {
const video = videoRef.current;
if (!video) return;

const onMeta = () => { setDuration(video.duration || msgDuration || 0); setIsLoaded(true); };
const onTime = () => setCurrentTime(video.currentTime);
const onEnded = () => { setIsPlaying(false); setCurrentTime(0); };

video.addEventListener('loadedmetadata', onMeta);
video.addEventListener('timeupdate', onTime);
video.addEventListener('ended', onEnded);

const onFSChange = () => setIsFullscreen(!!document.fullscreenElement);
document.addEventListener('fullscreenchange', onFSChange);

return () => {
video.removeEventListener('loadedmetadata', onMeta);
video.removeEventListener('timeupdate', onTime);
video.removeEventListener('ended', onEnded);
document.removeEventListener('fullscreenchange', onFSChange);
};
}, [url, msgDuration]);

const togglePlay = useCallback(async () => {
const video = videoRef.current;
if (!video) return;
if (isPlaying) {
video.pause();
setIsPlaying(false);
} else {
await video.play();
setIsPlaying(true);
}
}, [isPlaying]);

const toggleMute = useCallback((e) => {
e.stopPropagation();
const video = videoRef.current;
if (!video) return;
video.muted = !isMuted;
setIsMuted(!isMuted);
}, [isMuted]);

const handleSeek = useCallback((e) => {
e.stopPropagation();
const video = videoRef.current;
if (!video || !duration) return;
const rect = e.currentTarget.getBoundingClientRect();
const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
video.currentTime = ratio * duration;
}, [duration]);

const handleFullscreen = useCallback((e) => {
e.stopPropagation();
const container = wrapRef.current;
if (!container) return;
if (!document.fullscreenElement) {
container.requestFullscreen?.();
} else {
document.exitFullscreen?.();
}
}, []);

const controlBg = 'bg-black/50 backdrop-blur-sm';
const progressFill = isMe ? '#fff' : '#60a5fa';

return (
// ANTI-COPY xususiyatlari qo'shildi
<div
className="px-0 pt-0 pb-0 select-none"
onContextMenu={(e) => e.preventDefault()}
style={{ WebkitTouchCallout: 'none', WebkitUserSelect: 'none', userSelect: 'none' }}
>
<div
ref={wrapRef}
className="relative overflow-hidden bg-black cursor-pointer select-none"
style={{ borderRadius: '14px 14px 0 0', maxWidth: 280, aspectRatio: '16/9' }}
onClick={togglePlay}
onMouseEnter={() => setShowControls(true)}
onMouseLeave={() => setShowControls(false)}
>
<video
ref={videoRef}
src={url}
playsInline
preload="metadata"
className="w-full h-full object-cover pointer-events-none"
/>

<div
className={[
'absolute inset-0 flex items-center justify-center',
'transition-opacity duration-200 pointer-events-none',
isPlaying && !showControls ? 'opacity-0' : 'opacity-100',
 ].join(' ')}
>
{(!isPlaying || showControls) && (
<div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
)}

<div
className={[
'relative z-10 w-14 h-14 rounded-full flex items-center justify-center pointer-events-auto',
controlBg,
'transition-all duration-200',
isPlaying && !showControls ? 'scale-0 opacity-0' : 'scale-100 opacity-100',
 ].join(' ')}
onClick={(e) => {
e.stopPropagation();
togglePlay();
}}
>
{isPlaying
? <Pause size={22} fill="white" className="text-white" />
: <Play size={22} fill="white" className="text-white ml-0.5" />
}
</div>
</div>

{!isPlaying && !isLoaded && msgDuration && (
<div className="absolute bottom-2 left-2 z-10 pointer-events-none">
<span className={text-[11px] font-semibold text-white/80 ${controlBg} px-2 py-0.5 rounded-full`}>
{formatDuration(msgDuration)}
</span>
</div>
)}

{(showControls || isPlaying) && (
<div
className="absolute bottom-0 left-0 right-0 z-10 px-2 pb-2 pt-6 pointer-events-auto"
style={{ background: 'linear-gradient(transparent, rgba(0,0,0,0.7))' }}
onClick={(e) => e.stopPropagation()}
>
<div
className="relative h-1 rounded-full cursor-pointer mb-2 overflow-hidden"
style={{ background: 'rgba(255,255,255,0.2)' }}
onClick={handleSeek}
>
<div
className="absolute left-0 top-0 h-full rounded-full transition-all duration-100"
style={{ width: ``${progress}%`, background: progressFill }}
/>
</div>

<div className="flex items-center justify-between">
<span className="text-[11px] text-white/70 tabular-nums font-medium pointer-events-none">
{formatDuration(currentTime)} / {formatDuration(duration)}
</span>

<div className="flex items-center gap-1.5">
<button
onClick={toggleMute}
className={w-6 h-6 rounded-full ${controlBg} flex items-center justify-center text-white hover:bg-black/70 transition-colors} &gt; {isMuted ? &lt;VolumeX size={12} /&gt; : &lt;Volume2 size={12} /&gt;} &lt;/button&gt; &lt;button onClick={handleFullscreen} className={w-6 h-6 rounded-full ${controlBg} flex items-center justify-center text-white hover:bg-black/70 transition-colors}
>
<Maximize2 size={11} />
</button>
</div>
</div>
</div>
)}
</div>

{fileName && (
<div className="px-3 py-1 pointer-events-none">
<p className={text-[11px] truncate ${isMe ? 'text-white/50' : 'text-slate-500'}}>
{fileName}
</p>
</div>
)}
</div>
);
};

const VideoBubble = (props) => {
const { message } = props;
const currentUser = useSelector((s) => s.auth.user);
const isMe = message?.user_id === currentUser?.id;

return (
<BaseBubble {...props}>
<VideoPlayer
url={message.file_url}
fileName={message.file_name}
fileSize={message.file_size}
duration={message.duration}
isMe={isMe}
/>
</BaseBubble>
);
};

export default VideoBubble;

