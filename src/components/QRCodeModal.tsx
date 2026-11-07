import React, { useEffect, useState } from 'react';
import {
  Check,
  CheckCircle2,
  Copy,
  Edit2,
  ExternalLink,
  Globe,
  Info,
  Laptop,
  QrCode,
  RotateCcw,
  Smartphone,
  Tv,
} from 'lucide-react';
import QRCode from 'qrcode';
import { TEAMS } from '../data/quizData';
import { TeamId } from '../types/game';

interface QRCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type TabType = 'phones' | 'laptops' | 'projector';

export const QRCodeModal: React.FC<QRCodeModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<TabType>('phones');
  const [qrCodes, setQrCodes] = useState<Record<string, string>>({});
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Dynamic public domain handling
  const [baseUrl, setBaseUrl] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return window.location.origin;
    }
    return '';
  });
  const [customUrlInput, setCustomUrlInput] = useState<string>('');
  const [isEditingUrl, setIsEditingUrl] = useState<boolean>(false);
  const [detectedServerUrl, setDetectedServerUrl] = useState<string>('');

  // Fetch server config for APP_URL on mount or open
  useEffect(() => {
    if (!isOpen) return;

    fetch('/api/config')
      .then((res) => res.json())
      .then((data) => {
        if (data.appUrl && data.appUrl !== 'MY_APP_URL') {
          setDetectedServerUrl(data.appUrl);
          // If current origin is localhost, prioritize the public appUrl
          if (
            window.location.hostname === 'localhost' ||
            window.location.hostname === '127.0.0.1' ||
            !baseUrl
          ) {
            setBaseUrl(data.appUrl);
            setCustomUrlInput(data.appUrl);
          }
        } else if (data.detectedUrl) {
          setDetectedServerUrl(data.detectedUrl);
          if (
            (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') &&
            data.detectedUrl.startsWith('https://')
          ) {
            setBaseUrl(data.detectedUrl);
            setCustomUrlInput(data.detectedUrl);
          }
        }
      })
      .catch(() => {});
  }, [isOpen]);

  // Synchronize customUrlInput with baseUrl on load
  useEffect(() => {
    if (!customUrlInput && baseUrl) {
      setCustomUrlInput(baseUrl);
    }
  }, [baseUrl, customUrlInput]);

  // Regenerate QR codes whenever baseUrl changes
  useEffect(() => {
    if (!isOpen || !baseUrl) return;

    const cleanBase = baseUrl.replace(/\/+$/, '');

    const urlsToGenerate: Record<string, string> = {
      projector: `${cleanBase}/?role=projector`,
    };

    ([1, 2, 3, 4] as TeamId[]).forEach((tId) => {
      urlsToGenerate[`student_${tId}`] = `${cleanBase}/?role=student&team=${tId}`;
      urlsToGenerate[`laptop_${tId}`] = `${cleanBase}/?role=laptop&team=${tId}`;
    });

    const promises = Object.entries(urlsToGenerate).map(async ([key, url]) => {
      try {
        const qr = await QRCode.toDataURL(url, {
          width: 320,
          margin: 1.5,
          color: {
            dark: '#0f172a',
            light: '#ffffff',
          },
        });
        return [key, qr];
      } catch (e) {
        console.error('QR code generation error:', e);
        return [key, ''];
      }
    });

    Promise.all(promises).then((results) => {
      const map: Record<string, string> = {};
      results.forEach(([k, v]) => {
        if (k && v) map[k] = v;
      });
      setQrCodes(map);
    });
  }, [isOpen, baseUrl]);

  if (!isOpen) return null;

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleApplyCustomUrl = () => {
    if (customUrlInput.trim()) {
      let finalUrl = customUrlInput.trim();
      if (!finalUrl.startsWith('http://') && !finalUrl.startsWith('https://')) {
        finalUrl = `https://${finalUrl}`;
      }
      finalUrl = finalUrl.replace(/\/+$/, '');
      setBaseUrl(finalUrl);
      setIsEditingUrl(false);
    }
  };

  const handleResetToCurrentOrigin = () => {
    const origin = window.location.origin;
    setBaseUrl(origin);
    setCustomUrlInput(origin);
    setIsEditingUrl(false);
  };

  const isLocalhost = baseUrl.includes('localhost') || baseUrl.includes('127.0.0.1');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-4xl p-5 sm:p-6 shadow-2xl relative max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-100 flex items-center gap-2">
                <span>Mã QR & Đường Link Kết Nối Thiết Bị</span>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-normal">
                  Sẵn sàng Xuất Bản (Production Ready)
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Mã QR được tạo theo đường dẫn công khai đảm bảo sau khi xuất bản tất cả điện thoại và laptop đều kết nối được
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-800 text-slate-400 hover:text-slate-100 flex items-center justify-center font-bold text-base"
          >
            ✕
          </button>
        </div>

        {/* Public Domain Verification & Config Bar */}
        <div className="mt-3 bg-slate-950 p-3 rounded-xl border border-slate-800 flex flex-col gap-2">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2 text-slate-300 font-semibold">
              <Globe className="w-4 h-4 text-amber-400" />
              <span>Đường dẫn dùng tạo mã QR:</span>
              <span className="font-mono text-amber-400 font-bold px-2 py-0.5 rounded bg-slate-900 border border-slate-800">
                {baseUrl}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsEditingUrl(!isEditingUrl)}
                className="text-slate-400 hover:text-slate-200 text-xs font-semibold flex items-center gap-1 underline"
              >
                <Edit2 className="w-3 h-3" />
                <span>{isEditingUrl ? 'Đóng chỉnh sửa' : 'Đổi link xuất bản'}</span>
              </button>

              <button
                onClick={handleResetToCurrentOrigin}
                className="text-slate-400 hover:text-slate-200 text-xs font-semibold flex items-center gap-1 underline"
                title="Sử dụng địa chỉ trình duyệt hiện tại"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Mặc định</span>
              </button>
            </div>
          </div>

          {/* Editable URL Input */}
          {isEditingUrl && (
            <div className="flex items-center gap-2 pt-2 border-t border-slate-800/80">
              <input
                type="text"
                value={customUrlInput}
                onChange={(e) => setCustomUrlInput(e.target.value)}
                placeholder="Nhập URL xuất bản của bạn (ví dụ: https://ten-mien-cua-ban.run.app)"
                className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-100 font-mono focus:outline-none focus:border-amber-400"
              />
              <button
                onClick={handleApplyCustomUrl}
                className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-xs"
              >
                Cập nhật mã QR
              </button>
            </div>
          )}

          {/* Connection Status Indicator */}
          <div className="text-[11px] flex items-center gap-2 pt-1 border-t border-slate-900">
            {!isLocalhost ? (
              <span className="text-emerald-400 flex items-center gap-1 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>
                  Đường dẫn công khai HTTPS hợp lệ: Điện thoại quét mã QR từ camera ở bất cứ đâu (Wifi trường học hoặc 4G/5G) đều sẽ mở được ngay lập tức!
                </span>
              </span>
            ) : (
              <span className="text-amber-400/90 flex items-center gap-1">
                <Info className="w-3.5 h-3.5 shrink-0" />
                <span>
                  Đang ở chế độ xem thử nội bộ. Khi bạn bấm **Xuất bản (Publish)**, hãy mở link xuất bản chính thức hoặc dán domain vào ô trên để quét bằng camera điện thoại.
                </span>
              </span>
            )}
          </div>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center gap-2 my-3 bg-slate-950 p-1.5 rounded-xl border border-slate-800">
          <button
            onClick={() => setActiveTab('phones')}
            className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all ${
              activeTab === 'phones'
                ? 'bg-amber-500 text-slate-950 shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Smartphone className="w-4 h-4" />
            <span>4 Điện thoại trên bảng (4 Đội)</span>
          </button>

          <button
            onClick={() => setActiveTab('laptops')}
            className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all ${
              activeTab === 'laptops'
                ? 'bg-amber-500 text-slate-950 shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Laptop className="w-4 h-4" />
            <span>4 Laptop nhóm dưới (Chỉ xem đề)</span>
          </button>

          <button
            onClick={() => setActiveTab('projector')}
            className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all ${
              activeTab === 'projector'
                ? 'bg-amber-500 text-slate-950 shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Tv className="w-4 h-4" />
            <span>Màn hình máy chiếu</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="overflow-y-auto flex-1 pr-1">
          {activeTab === 'phones' && (
            <div>
              <div className="mb-3 text-xs text-slate-400 bg-amber-500/10 border border-amber-500/20 p-2.5 rounded-lg flex items-center gap-2">
                <span className="text-amber-400 font-bold">Hướng dẫn:</span> 4 bạn đại diện cầm điện thoại quét mã của đội mình (HULK, THOR, SPIDERMAN, CAPTAIN) để trả lời câu hỏi và có thể bấm nút chiếu câu hỏi lên màn hình lớp.
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                {([1, 2, 3, 4] as TeamId[]).map((tId) => {
                  const team = TEAMS[tId];
                  const cleanBase = baseUrl.replace(/\/+$/, '');
                  const url = `${cleanBase}/?role=student&team=${tId}`;
                  const qr = qrCodes[`student_${tId}`];
                  const isCopied = copiedKey === `student_${tId}`;

                  return (
                    <div
                      key={tId}
                      className="flex flex-col items-center bg-slate-950 border-2 rounded-xl p-3 text-center"
                      style={{ borderColor: team.hex }}
                    >
                      <div className="flex items-center gap-1.5 mb-2 font-black text-xs" style={{ color: team.hex }}>
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: team.hex }} />
                        {team.name}
                      </div>

                      <div className="bg-white p-2 rounded-xl shadow-inner mb-2.5">
                        {qr ? (
                          <img
                            src={qr}
                            alt={`QR Đội ${team.shortName}`}
                            className="w-36 h-36 object-contain"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="w-36 h-36 flex items-center justify-center text-slate-500 text-xs">
                            Đang tạo QR...
                          </div>
                        )}
                      </div>

                      <div className="text-[10px] text-slate-400 font-mono truncate w-full mb-2 bg-slate-900 px-2 py-1 rounded">
                        {url}
                      </div>

                      <div className="flex items-center gap-1 w-full mt-auto">
                        <button
                          onClick={() => copyToClipboard(url, `student_${tId}`)}
                          className="flex-1 py-1.5 px-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-[11px] font-semibold flex items-center justify-center gap-1"
                        >
                          {isCopied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                          {isCopied ? 'Đã sao chép' : 'Copy Link'}
                        </button>
                        <a
                          href={url}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[11px]"
                          title="Mở thử tab mới"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === 'laptops' && (
            <div>
              <div className="mb-3 text-xs text-slate-400 bg-sky-500/10 border border-sky-500/20 p-2.5 rounded-lg flex items-center gap-2">
                <span className="text-sky-400 font-bold">Hướng dẫn:</span> 4 máy tính mở sẵn link của từng đội dưới bàn học sinh. Màn hình chỉ hiển thị đề bài để cả nhóm cùng theo dõi và tính toán (không được chọn đáp án).
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                {([1, 2, 3, 4] as TeamId[]).map((tId) => {
                  const team = TEAMS[tId];
                  const cleanBase = baseUrl.replace(/\/+$/, '');
                  const url = `${cleanBase}/?role=laptop&team=${tId}`;
                  const qr = qrCodes[`laptop_${tId}`];
                  const isCopied = copiedKey === `laptop_${tId}`;

                  return (
                    <div
                      key={tId}
                      className="flex flex-col items-center bg-slate-950 border-2 rounded-xl p-3 text-center"
                      style={{ borderColor: team.hex }}
                    >
                      <div className="flex items-center gap-1.5 mb-2 font-black text-xs" style={{ color: team.hex }}>
                        <Laptop className="w-3.5 h-3.5" />
                        Laptop {team.shortName}
                      </div>

                      <div className="bg-white p-2 rounded-xl shadow-inner mb-2.5">
                        {qr ? (
                          <img
                            src={qr}
                            alt={`QR Laptop Đội ${team.shortName}`}
                            className="w-36 h-36 object-contain"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="w-36 h-36 flex items-center justify-center text-slate-500 text-xs">
                            Đang tạo QR...
                          </div>
                        )}
                      </div>

                      <div className="text-[10px] text-slate-400 font-mono truncate w-full mb-2 bg-slate-900 px-2 py-1 rounded">
                        {url}
                      </div>

                      <div className="flex items-center gap-1 w-full mt-auto">
                        <button
                          onClick={() => copyToClipboard(url, `laptop_${tId}`)}
                          className="flex-1 py-1.5 px-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-[11px] font-semibold flex items-center justify-center gap-1"
                        >
                          {isCopied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                          {isCopied ? 'Đã sao chép' : 'Copy Link'}
                        </button>
                        <a
                          href={url}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[11px]"
                          title="Mở thử tab mới"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === 'projector' && (
            <div className="flex flex-col items-center justify-center p-4">
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 max-w-sm w-full text-center flex flex-col items-center shadow-lg">
                <div className="flex items-center gap-2 mb-2 text-amber-400 font-extrabold text-sm">
                  <Tv className="w-5 h-5" />
                  Màn Hình Máy Chiếu Lớp Học
                </div>
                <p className="text-xs text-slate-400 mb-4">
                  Mở link này trên máy tính kết nối với máy chiếu lớn của lớp
                </p>

                <div className="bg-white p-3 rounded-xl shadow-inner mb-3">
                  {qrCodes['projector'] ? (
                    <img
                      src={qrCodes['projector']}
                      alt="QR Projector"
                      className="w-48 h-48 object-contain"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-48 h-48 flex items-center justify-center text-slate-500 text-xs">
                      Đang tạo QR...
                    </div>
                  )}
                </div>

                <div className="text-[10px] text-slate-400 font-mono truncate w-full mb-3 bg-slate-900 px-2 py-1 rounded">
                  {baseUrl.replace(/\/+$/, '')}/?role=projector
                </div>

                <div className="flex items-center gap-2 w-full">
                  <button
                    onClick={() =>
                      copyToClipboard(`${baseUrl.replace(/\/+$/, '')}/?role=projector`, 'projector')
                    }
                    className="flex-1 py-2 px-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-xs flex items-center justify-center gap-1.5"
                  >
                    {copiedKey === 'projector' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    {copiedKey === 'projector' ? 'Đã sao chép link' : 'Sao chép link máy chiếu'}
                  </button>
                  <a
                    href={`${baseUrl.replace(/\/+$/, '')}/?role=projector`}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs"
                    title="Mở tab mới"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
