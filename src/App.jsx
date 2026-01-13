import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  Plane, Train, Car, Utensils, Hotel, MapPin,
  Clock, AlertCircle, CheckCircle2,
  ChevronDown, RefreshCw, X, Edit2, Wallet,
  ExternalLink, Navigation, Calculator,
  FileText, Image as ImageIcon, Upload, Eye, Trash2, RotateCcw,
  Cloud, CloudOff, Loader2
} from 'lucide-react';

// Firebase Imports
import { initializeApp } from 'firebase/app';
import {
  getFirestore, doc, onSnapshot, setDoc
} from 'firebase/firestore';
import {
  getAuth, signInAnonymously, onAuthStateChanged
} from 'firebase/auth';

/**
 * --- 設定エリア (ここだけ書き換えてください) ---
 */
const firebaseConfig = {
  // ★ここにFirebaseコンソールからコピーした設定値を貼り付けてください
  apiKey: "AIzaSy...",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "...",
  appId: "..."
};
/** ------------------------------------------------ */

/**
 * Data Structure Definition
 */
const initialTripData = [
  {
    day: 1,
    date: '2026/03/03 (火)',
    title: '移動 & なばなの里',
    events: [
      {
        id: 'D1-01',
        time: '07:40',
        title: '自宅出発 (Taxi)',
        type: 'transport',
        financial: { amount: 3000, isPaid: false, category: 'transport' },
        details: {
          description: 'タクシーで赤間駅へ',
          tips: '寝坊リミット08:10。遅れたら即Plan B（08:24電車）へ。タクシー配車アプリを使う場合は15分前の予約推奨。',
          location: '赤間駅',
          link: ''
        }
      },
      {
        id: 'D1-02',
        time: '07:53',
        title: '赤間駅〜福岡空港',
        type: 'transport',
        financial: { amount: 3000, isPaid: false, category: 'transport' },
        details: {
          description: '赤間(07:53)→博多→地下鉄→福岡空港(08:55)',
          tips: '博多駅での乗り換えは「地下鉄空港線」です。ホーム一番端の階段が乗り換え口に近い車両（6号車付近）に乗るとスムーズです。',
          location: '福岡空港',
          link: ''
        }
      },
      {
        id: 'D1-03',
        time: '08:55',
        title: '福岡空港 手荷物＆保安検査',
        type: 'other',
        financial: { amount: 1500, isPaid: false, category: 'meal' },
        details: {
          description: '地下鉄改札→1F ANAカウンターで荷物預け→2F 保安検査',
          tips: 'ANA/SFJ共同運航。ANAの機械で預ける。空港内で軽食（おにぎり等）を購入し軽く済ませる（昼のひつまぶしに備える）。',
          location: '福岡空港 国内線ターミナル',
          link: ''
        }
      },
      {
        id: 'D1-04',
        time: '10:15',
        title: 'フライト (FUK -> NGO)',
        type: 'transport',
        financial: { amount: 53070, isPaid: true, category: 'transport' },
        details: {
          description: 'ANA3858 (SFJ運航) / 予約番号: 0146',
          tips: '到着後、T1→アクセスプラザ→名鉄切符売場へ。「乗車券」と「ミューチケット」の2枚重ねて改札へ。4名掛けではなく進行方向席を確保。',
          location: '中部国際空港',
          link: ''
        }
      },
      {
        id: 'D1-05',
        time: '11:30',
        title: '中部国際空港 着〜移動',
        type: 'transport',
        financial: { amount: 3500, isPaid: false, category: 'transport' },
        details: {
          description: 'ミュースカイで名古屋駅へ',
          tips: '名鉄名古屋駅ホームに降りたら、必ず「中央改札口（地下1階）」への階段へ。改札を出て直進→ユニモールへ入る→直進して「U10番出口」から地上へ。',
          location: '名鉄名古屋駅',
          link: ''
        }
      },
      {
        id: 'D1-06',
        time: '13:15',
        title: '昼食：まるや本店 名駅3丁目店',
        type: 'meal',
        financial: { amount: 15000, isPaid: false, category: 'meal' },
        details: {
          description: 'ひつまぶし (13:30予約)',
          reservationNumber: 'IR0514375052',
          location: 'まるや本店 名駅3丁目店',
          tips: '15分前到着推奨。荷物は店で預ける。',
          link: ''
        }
      },
      {
        id: 'D1-07',
        time: '15:00',
        title: 'ホテルチェックイン & 完全休息',
        type: 'hotel',
        financial: { amount: 42900, isPaid: false, category: 'accommodation' },
        details: {
          description: 'コンフォートホテル名古屋',
          tips: '靴を脱いで16:00まで絶対休憩。フロントで子供用アメニティ（スリッパ・歯ブラシ）を受け取る。',
          location: 'コンフォートホテル名古屋名駅南',
          link: ''
        }
      },
      {
        id: 'D1-08',
        time: '16:00',
        title: 'レンタカー出発',
        type: 'transport',
        financial: { amount: 5500, isPaid: false, category: 'transport' },
        details: {
          description: 'ニッポンレンタカー',
          tips: 'ナビ設定：なばなの里 (0594-41-0787)。名古屋高速は分岐が複雑なのでナビの音声をよく聞くこと。',
          location: 'ニッポンレンタカー 名駅笹島',
          link: ''
        }
      },
      {
        id: 'D1-09',
        time: '17:30',
        title: '夕食：長島ビール園',
        type: 'meal',
        financial: { amount: 6000, isPaid: false, category: 'meal' },
        details: {
          description: 'なばなの里内レストラン',
          tips: '点灯前の早め入店で混雑回避。なばなクーポン（金券）利用可。端数は現金/カードで。',
          location: '長島ビール園',
          link: ''
        }
      },
      {
        id: 'D1-10',
        time: '18:20',
        title: 'なばなの里 イルミネーション',
        type: 'activity',
        financial: { amount: 5000, isPaid: false, category: 'activity' },
        details: {
          description: '点灯(18:20)〜鑑賞',
          tips: '無料駐車場「A駐車場」がゲートに最も近いです。水上イルミ→光のトンネル→メイン会場の順路で。',
          location: 'なばなの里',
          link: ''
        }
      }
    ]
  },
  {
    day: 2,
    date: '2026/03/04 (水)',
    title: 'ジブリパーク',
    events: [
      {
        id: 'D2-01',
        time: '07:00',
        title: '朝食 (Comfort Hotel)',
        type: 'meal',
        financial: { amount: 0, isPaid: true, category: 'meal' },
        details: {
          description: '早起き戦略・ピーク前逃げ切り',
          tips: '7:30の混雑前にサッと済ませる。パワー重視（ピラフ、肉）。部屋に戻ってトイレタイム確保。ワッフルは最初に焼くのがコツ。',
          location: 'コンフォートホテル名古屋名駅南',
          link: ''
        }
      },
      {
        id: 'D2-02',
        time: '08:30',
        title: 'ホテル出発 (地下鉄+リニモ)',
        type: 'transport',
        financial: { amount: 2500, isPaid: false, category: 'transport' },
        details: {
          description: '名古屋(東山線)→藤が丘(リニモ乗換)→愛・地球博記念公園',
          tips: '藤が丘の乗換は地下から高架へ（案内表示Linimoに従う）。リニモは先頭車両へ！前面展望が楽しめます。',
          location: '藤が丘駅',
          link: ''
        }
      },
      {
        id: 'D2-03',
        time: '10:00',
        title: 'ジブリパーク入園',
        type: 'activity',
        financial: { amount: 17800, isPaid: true, category: 'activity' },
        details: {
          description: '大さんぽ券プレミアム',
          tips: 'QRコード準備。エレベーター塔→青春の丘方面へ向かうのが王道ルート。',
          location: 'ジブリパーク',
          link: ''
        }
      },
      {
        id: 'D2-04',
        time: '12:00',
        title: 'ランチ (Variable)',
        type: 'meal',
        financial: { amount: 5000, isPaid: false, category: 'meal' },
        alternatives: [
            { title: 'ジブリの大倉庫内カフェ', description: '雰囲気を楽しむならここ（激混み注意）', location: 'ジブリの大倉庫' },
            { title: 'キッチンカー', description: '時間を節約して遊ぶならここ', location: 'ジブリパーク' },
            { title: 'ロタンダ風ヶ丘', description: '公園北口エリアのショップ＆カフェ', location: 'ロタンダ風ヶ丘' }
        ],
        details: {
          description: '状況に応じて判断',
          tips: '混雑状況を見て柔軟に。キッチンカーで軽食にして夜に備えるのもあり。',
          location: 'ジブリパーク',
          link: ''
        }
      },
      {
        id: 'D2-05',
        time: '18:30',
        title: '夕食：エスカ地下街',
        type: 'meal',
        financial: { amount: 6000, isPaid: false, category: 'meal' },
        alternatives: [
            { title: '矢場とん (みそかつ)', description: '名古屋名物ド定番', location: '矢場とん 名古屋駅エスカ店' },
            { title: '山本屋本店 (味噌煮込み)', description: '固めの麺が特徴', location: '山本屋本店 エスカ店' }
        ],
        details: {
          description: '帰り道最短ルート',
          tips: '名駅に着いたら「新幹線」の表示を目指して歩くと、エスカへの入り口が見えてきます。',
          location: 'エスカ地下街',
          link: ''
        }
      }
    ]
  },
  {
    day: 3,
    date: '2026/03/05 (木)',
    title: 'レゴランド',
    events: [
      {
        id: 'D3-01',
        time: '08:45',
        title: '朝食 (Comfort Hotel)',
        type: 'meal',
        financial: { amount: 0, isPaid: true, category: 'meal' },
        details: {
          description: '社長出勤戦略・残り福狙い',
          tips: 'ピーク後の8:45に優雅に。9:30には片付けが始まるので9:15までに料理確保。スムージーを楽しむ余裕を持つ。',
          location: 'コンフォートホテル名古屋名駅南',
          link: ''
        }
      },
      {
        id: 'D3-02',
        time: '10:15',
        title: 'ホテル出発 (あおなみ線)',
        type: 'transport',
        financial: { amount: 1000, isPaid: false, category: 'transport' },
        details: {
          description: '名古屋駅(あおなみ線)→金城ふ頭',
          tips: 'あおなみ線改札は「桜通口」側。新幹線口から遠いので移動15分見る。コンコースを端から端まで歩きます。',
          location: '名古屋駅 あおなみ線',
          link: ''
        }
      },
      {
        id: 'D3-03',
        time: '11:00',
        title: 'レゴランド入園',
        type: 'activity',
        financial: { amount: 13100, isPaid: true, category: 'activity' },
        details: {
          description: '福利厚生チケット利用',
          tips: '飲食物持込禁止（水筒・離乳食OK）。混雑時はアプリでスキップパス購入検討。',
          location: 'レゴランド・ジャパン',
          link: ''
        }
      },
      {
        id: 'D3-04',
        time: '19:00',
        title: '豪華ディナー (Special)',
        type: 'meal',
        financial: { amount: 45000, isPaid: false, category: 'meal' },
        alternatives: [
            { title: '人形町今半', description: 'ミッドランドスクエア41階 すき焼き', location: '人形町今半 名古屋ミッドランドスクエア店' },
            { title: '飛騨牛一頭家 馬喰一代', description: '極上の飛騨牛焼肉/しゃぶしゃぶ', location: '飛騨牛一頭家 馬喰一代 名古屋WEST' },
            { title: '銀座 久兵衛', description: '最高級の寿司', location: '銀座 久兵衛 名古屋' }
        ],
        details: {
          description: '旅の締めくくり・夜景と接客重視',
          tips: '人形町今半の場合：地下街から直結エレベーターで「オフィス棟」41階へ。服装はスマートカジュアル推奨（レゴランド帰りでも清潔ならOK）。',
          location: 'ミッドランドスクエア',
          link: ''
        }
      }
    ]
  },
  {
    day: 4,
    date: '2026/03/06 (金)',
    title: '科学館 & 空港',
    events: [
      {
        id: 'D4-01',
        time: '08:00',
        title: '朝食 (Comfort Hotel)',
        type: 'meal',
        financial: { amount: 0, isPaid: true, category: 'meal' },
        details: {
          description: '荷造り並行戦略',
          tips: 'パパが部屋にコーヒーとパンを持ち帰り、部屋食も検討（要現地確認）。凪ちゃんが寝ていれば一彦さんが運ぶ。',
          location: 'コンフォートホテル名古屋名駅南',
          link: ''
        }
      },
      {
        id: 'D4-02',
        time: '10:30',
        title: 'チェックアウト & 荷物預け',
        type: 'other',
        financial: { amount: 1500, isPaid: false, category: 'other' },
        details: {
          description: 'タクシーで名駅へ',
          tips: '「ゲートタワー」1階バスターミナル付近や、地下鉄改札付近のロッカーが比較的空いています。',
          location: 'JRゲートタワー',
          link: ''
        }
      },
      {
        id: 'D4-03',
        time: '11:00',
        title: '名古屋市科学館',
        type: 'activity',
        financial: { amount: 1600, isPaid: false, category: 'activity' },
        details: {
          description: '世界最大級のプラネタリウム',
          tips: '到着したらまずチケット売り場で希望時間の席を確保。昼食は周辺カフェで軽く済ませる。',
          location: '名古屋市科学館',
          link: ''
        }
      },
      {
        id: 'D4-04',
        time: '13:15',
        title: '移動〜中部国際空港',
        type: 'transport',
        financial: { amount: 3500, isPaid: false, category: 'transport' },
        details: {
          description: '荷物回収→ミュースカイ→空港',
          tips: '時間に余裕を持って。',
          location: '名鉄名古屋駅',
          link: ''
        }
      },
      {
        id: 'D4-05',
        time: '14:15',
        title: '空港着・荷物預け・遊び',
        type: 'activity',
        financial: { amount: 0, isPaid: true, category: 'activity' },
        details: {
          description: 'フライト・オブ・ドリームズ',
          tips: '駅着→T1(3F)で荷物預け→アクセスプラザ経由でT2方面へ移動（徒歩10分）。1Fフライトパークで遊ぶ。',
          location: 'フライト・オブ・ドリームズ',
          link: ''
        }
      },
      {
        id: 'D4-06',
        time: '17:15',
        title: 'お土産・保安検査',
        type: 'other',
        financial: { amount: 10000, isPaid: false, category: 'shopping' },
        details: {
          description: 'T1 3F 銘品館',
          tips: '「赤福」「ゆかり」等はここで揃う。時間余れば「SOLA SPA 風の湯」で入浴。',
          location: '中部国際空港 第1ターミナル',
          link: ''
        }
      },
      {
        id: 'D4-07',
        time: '18:20',
        title: 'フライト (NGO -> FUK)',
        type: 'transport',
        financial: { amount: 0, isPaid: true, category: 'transport' },
        details: {
          description: 'ANA3869 (SFJ運航) / 予約番号: 0185',
          tips: '福岡着後、タクシー/地下鉄で帰宅。',
          location: '中部国際空港',
          link: ''
        }
      }
    ]
  }
];

// Utility: Format currency
const formatYen = (amount) => {
  return new Intl.NumberFormat('ja-JP', { style: 'currency', currency: 'JPY' }).format(amount);
};

// UI Components
const FinancialSummary = ({ tripData }) => {
  const stats = useMemo(() => {
    let paid = 0;
    let unpaid = 0;
    let total = 0;
    
    tripData.forEach(day => {
      day.events.forEach(event => {
        if (event.financial.isPaid) {
          paid += event.financial.amount;
        } else {
          unpaid += event.financial.amount;
        }
        total += event.financial.amount;
      });
    });

    return { paid, unpaid, total };
  }, [tripData]);

  return (
    <div className="bg-white p-6 shadow-md rounded-xl border border-gray-100">
      <h3 className="text-gray-500 text-sm font-bold uppercase tracking-wider mb-6 border-b pb-2">旅費サマリー</h3>
      
      <div className="grid grid-cols-2 gap-8 mb-6">
        <div className="text-center p-4 bg-green-50 rounded-xl">
          <p className="text-sm text-green-700 font-bold mb-1">支払済 (Paid)</p>
          <p className="text-2xl font-bold text-green-700">{formatYen(stats.paid)}</p>
        </div>
        <div className="text-center p-4 bg-orange-50 rounded-xl">
          <p className="text-sm text-orange-700 font-bold mb-1">現地支払予定 (未払)</p>
          <p className="text-2xl font-bold text-orange-600">{formatYen(stats.unpaid)}</p>
        </div>
      </div>

      <div className="mb-2 flex justify-between text-sm text-gray-500 font-medium">
        <span>予算消化率</span>
        <span>{Math.round((stats.paid / stats.total) * 100)}%</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden shadow-inner">
        <div
          className="bg-blue-600 h-4 rounded-full transition-all duration-500"
          style={{ width: `${(stats.paid / stats.total) * 100}%` }}
        ></div>
      </div>
      <div className="mt-6 text-center text-gray-400 text-xs">
        総予算合計: {formatYen(stats.total)}
      </div>
    </div>
  );
};

const EventIcon = ({ type }) => {
  switch (type) {
    case 'transport': return <div className="p-2 bg-blue-100 rounded-full text-blue-600"><Train size={18} /></div>;
    case 'meal': return <div className="p-2 bg-orange-100 rounded-full text-orange-600"><Utensils size={18} /></div>;
    case 'activity': return <div className="p-2 bg-purple-100 rounded-full text-purple-600"><MapPin size={18} /></div>;
    case 'hotel': return <div className="p-2 bg-indigo-100 rounded-full text-indigo-600"><Hotel size={18} /></div>;
    default: return <div className="p-2 bg-gray-100 rounded-full text-gray-600"><Clock size={18} /></div>;
  }
};

// File Preview Modal
const PreviewModal = ({ file, isOpen, onClose }) => {
  if (!isOpen || !file) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 z-[60] flex flex-col items-center justify-center p-4 animate-in fade-in duration-200">
      <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-gray-800 text-white rounded-full hover:bg-gray-700">
        <X size={24} />
      </button>
      
      <div className="w-full max-w-4xl h-[85vh] bg-white rounded-lg overflow-hidden flex flex-col">
        <div className="p-3 border-b flex justify-between items-center bg-gray-50">
           <span className="font-bold text-gray-700 truncate">{file.name}</span>
           <span className="text-xs px-2 py-1 bg-gray-200 rounded text-gray-600 uppercase">{file.type}</span>
        </div>
        <div className="flex-1 overflow-auto bg-gray-100 flex items-center justify-center p-2">
            {file.type === 'pdf' ? (
                <iframe src={file.data} className="w-full h-full border-0 rounded" title="PDF Preview" />
            ) : (
                <img src={file.data} alt="Preview" className="max-w-full max-h-full object-contain shadow-lg" />
            )}
        </div>
      </div>
    </div>
  );
};

const DetailModal = ({ event, isOpen, onClose, onUpdate, onSwap }) => {
  if (!isOpen || !event) return null;

  const [editAmount, setEditAmount] = useState(event.financial.amount);
  const [isPaid, setIsPaid] = useState(event.financial.isPaid);
  const [editTime, setEditTime] = useState(event.time);
  const [editLink, setEditLink] = useState(event.details.link || '');
  const [editFile, setEditFile] = useState(event.details.file);
  const [localFile, setLocalFile] = useState(null); // Local storage specific file state
  const [isEditing, setIsEditing] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  
  const fileInputRef = useRef(null);
  
  // Load local file from localStorage when event opens
  useEffect(() => {
    setEditAmount(event.financial.amount);
    setIsPaid(event.financial.isPaid);
    setEditTime(event.time);
    setEditLink(event.details.link || '');
    
    // Attempt to load file from local storage first
    try {
        const savedFile = localStorage.getItem(`nagoya_trip_file_${event.id}`);
        if(savedFile) {
            setLocalFile(JSON.parse(savedFile));
        } else {
            setLocalFile(null);
        }
    } catch(e) { console.error(e) }
    
  }, [event]);

  const handleSave = () => {
    // 1. Save main data to Firestore (via parent function)
    onUpdate(event.day, event.id, {
      ...event,
      time: editTime,
      financial: { ...event.financial, amount: Number(editAmount), isPaid },
      details: { ...event.details, link: editLink } // Note: file is NOT saved to Firestore
    });

    // 2. Save file to Local Storage (only on this device)
    if (localFile) {
        try {
            localStorage.setItem(`nagoya_trip_file_${event.id}`, JSON.stringify(localFile));
        } catch(e) {
            alert('ファイルの保存に失敗しました（容量オーバーの可能性があります）');
        }
    } else {
        localStorage.removeItem(`nagoya_trip_file_${event.id}`);
    }

    setIsEditing(false);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert("ファイルサイズが大きすぎます (5MB以下にしてください)");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        const fileType = file.type.includes('pdf') ? 'pdf' : 'image';
        setLocalFile({
          name: file.name,
          type: fileType,
          data: reader.result
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const getGoogleMapsUrl = (query) => {
    if (!query) return '#';
    return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(query)}`;
  };

  return (
    <>
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="p-4 border-b flex justify-between items-center sticky top-0 bg-white z-10">
          <h3 className="font-bold text-lg text-gray-800 truncate pr-4">{event.title}</h3>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-100">
            <X size={24} className="text-gray-500" />
          </button>
        </div>

        <div className="p-5 space-y-6">
          {/* Time & Edit Toggle */}
          <div className="flex justify-between items-center">
            {isEditing ? (
              <input
                type="time"
                value={editTime}
                onChange={(e) => setEditTime(e.target.value)}
                className="border p-2 rounded"
              />
            ) : (
              <div className="flex items-center text-2xl font-bold text-blue-600">
                <Clock className="mr-2" /> {event.time}
              </div>
            )}
            <button
              onClick={() => isEditing ? handleSave() : setIsEditing(true)}
              className={`text-sm flex items-center px-3 py-1.5 rounded-lg border transition-all ${
                isEditing
                ? 'bg-blue-600 text-white hover:bg-blue-700 border-blue-600 shadow-md'
                : 'bg-gray-50 text-gray-600 hover:text-blue-600 hover:bg-blue-50'
              }`}
            >
              {isEditing ? <CheckCircle2 className="mr-1" size={16} /> : <Edit2 className="mr-1" size={16} />}
              {isEditing ? "保存する" : "編集"}
            </button>
          </div>

          {/* Alternative Slot Switching */}
          {event.alternatives && (
            <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
              <label className="text-xs font-bold text-yellow-700 uppercase mb-1 block flex items-center">
                <RefreshCw size={12} className="mr-1"/> プラン切替
              </label>
              <select
                className="w-full p-2 border rounded bg-white text-sm"
                onChange={(e) => onSwap(event.day, event.id, event.alternatives[e.target.value])}
                defaultValue=""
              >
                <option value="" disabled>プランを選択してください...</option>
                {event.alternatives.map((alt, idx) => (
                  <option key={idx} value={idx}>{alt.title}</option>
                ))}
              </select>
            </div>
          )}

          {/* Financials */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="text-xs font-bold text-gray-500 uppercase mb-2 flex items-center">
              <Wallet size={12} className="mr-1"/> 金銭管理
            </h4>
            <div className="flex items-center justify-between">
              {isEditing ? (
                 <div className="flex items-center">
                    <span className="mr-1 text-gray-500">¥</span>
                    <input
                        type="number"
                        value={editAmount}
                        onChange={(e) => setEditAmount(e.target.value)}
                        className="border p-1 rounded w-24 font-bold text-lg"
                    />
                 </div>
              ) : (
                <span className={`text-xl font-bold ${event.financial.isPaid ? 'text-green-600' : 'text-orange-500'}`}>
                  {formatYen(event.financial.amount)}
                </span>
              )}
              
              <button
                onClick={() => {
                   // Toggle paid status
                   const newStatus = !isPaid;
                   setIsPaid(newStatus);
                   // If not in edit mode, save immediately
                   if(!isEditing) {
                     onUpdate(event.day, event.id, {
                        ...event,
                        financial: { ...event.financial, isPaid: newStatus }
                     });
                   }
                }}
                className={`px-3 py-1 rounded-full text-xs font-bold flex items-center transition-colors ${
                  isPaid ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-orange-100 text-orange-700 hover:bg-orange-200'
                }`}
              >
                {isPaid ? '支払済' : '未払'}
              </button>
            </div>
          </div>

          {/* File Attachment Section (PDF/Image) */}
          {(isEditing || localFile) && (
             <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                <div className="flex justify-between items-center mb-2">
                    <h4 className="text-xs font-bold text-slate-600 uppercase flex items-center">
                        <span className="flex items-center"><FileText size={12} className="mr-1"/> 添付ファイル</span>
                    </h4>
                    {!isEditing && localFile && (
                        <span className="text-[10px] text-orange-500 flex items-center">
                             <CloudOff size={10} className="mr-1"/> この端末のみ保存
                        </span>
                    )}
                    {isEditing && (
                      <label className="cursor-pointer bg-white border border-gray-300 hover:bg-gray-50 px-2 py-0.5 rounded text-[10px] flex items-center shadow-sm">
                          <Upload size={10} className="mr-1"/> アップロード
                          <input
                            type="file"
                            accept="image/*,application/pdf"
                            className="hidden"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                          />
                      </label>
                    )}
                </div>
                
                {localFile ? (
                    <div className="flex items-center justify-between bg-white p-2 rounded border border-gray-200">
                        <div className="flex items-center min-w-0">
                            {localFile.type === 'pdf' ? <FileText size={20} className="text-red-500 mr-2 flex-shrink-0" /> : <ImageIcon size={20} className="text-blue-500 mr-2 flex-shrink-0" />}
                            <span className="text-sm text-gray-700 truncate">{localFile.name}</span>
                        </div>
                        <div className="flex items-center space-x-1 ml-2">
                             <button
                                onClick={() => setShowPreview(true)}
                                className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"
                                title="プレビュー"
                             >
                                <Eye size={16} />
                             </button>
                             {isEditing && (
                                <button
                                    onClick={() => { setLocalFile(null); if(fileInputRef.current) fileInputRef.current.value = ""; }}
                                    className="p-1.5 text-red-500 hover:bg-red-50 rounded"
                                    title="削除"
                                >
                                    <Trash2 size={16} />
                                </button>
                             )}
                        </div>
                    </div>
                ) : (
                    <div className="text-xs text-gray-400 text-center py-2 border-dashed border-2 border-gray-200 rounded">
                        ファイルなし
                    </div>
                )}
                
                {localFile && !isEditing && (
                     <button
                        onClick={() => setShowPreview(true)}
                        className="w-full mt-2 bg-slate-700 text-white text-xs font-bold py-2 rounded hover:bg-slate-800 flex items-center justify-center"
                     >
                        <Eye size={12} className="mr-1" /> 添付ファイルを見る
                     </button>
                )}
             </div>
          )}

          {/* Link Section */}
          {(isEditing || event.details.link) && (
            <div className="bg-indigo-50 p-3 rounded-lg border border-indigo-100">
                <h4 className="text-xs font-bold text-indigo-700 uppercase mb-2 flex items-center">
                  <ExternalLink size={12} className="mr-1"/> 関連リンク (URL)
                </h4>
                {isEditing ? (
                    <input
                        type="url"
                        placeholder="https://..."
                        value={editLink}
                        onChange={(e) => setEditLink(e.target.value)}
                        className="w-full border p-2 rounded text-sm"
                    />
                ) : (
                    <a
                        href={event.details.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-indigo-600 underline text-sm break-all flex items-center hover:text-indigo-800"
                    >
                        {event.details.link} <ExternalLink size={12} className="ml-1" />
                    </a>
                )}
            </div>
          )}

          {/* Details */}
          <div>
            <h4 className="text-sm font-bold text-gray-700 mb-2">詳細メモ</h4>
            <p className="text-gray-600 leading-relaxed">{event.details.description}</p>
            {event.details.reservationNumber && (
              <div className="mt-2 inline-block bg-blue-50 text-blue-700 px-3 py-1 rounded text-sm font-mono">
                予約番号: {event.details.reservationNumber}
              </div>
            )}
          </div>

          {/* Tips - Important for family */}
          {event.details.tips && (
            <div className="bg-orange-50 border-l-4 border-orange-400 p-4 rounded-r-lg">
              <h4 className="text-sm font-bold text-orange-700 mb-1 flex items-center">
                <AlertCircle size={14} className="mr-1" /> 攻略・注意点
              </h4>
              <p className="text-sm text-gray-700 leading-relaxed">{event.details.tips}</p>
            </div>
          )}

          {/* Location/Route & Google Maps Button */}
          {event.details.location && (
            <div className="space-y-3">
                <div className="bg-blue-50 p-3 rounded-lg flex items-start">
                    <MapPin size={16} className="text-blue-500 mt-1 mr-2 flex-shrink-0" />
                    <p className="text-sm text-blue-800">{event.details.location}</p>
                </div>
                
                <a
                    href={getGoogleMapsUrl(event.details.location || event.title)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center w-full bg-blue-600 text-white font-bold py-3 rounded-lg shadow-md hover:bg-blue-700 transition-colors"
                >
                    <Navigation size={18} className="mr-2" />
                    📍 現在地からのルート
                </a>
            </div>
          )}
        </div>
        
        <div className="p-4 border-t bg-gray-50 flex justify-end">
            <button
                onClick={onClose}
                className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300"
            >
                閉じる
            </button>
        </div>
      </div>
    </div>
    
    {/* Preview Modal */}
    <PreviewModal
        file={localFile}
        isOpen={showPreview}
        onClose={() => setShowPreview(false)}
    />
    </>
  );
};

export default function NagoyaTripApp() {
  // --- Firebase Setup ---
  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);
  const db = getFirestore(app);
  // 固定IDを使用
  const appId = 'nagoya-trip-2026';

  const [tripData, setTripData] = useState(initialTripData);
  const [user, setUser] = useState(null);
  const [isSynced, setIsSynced] = useState(false);
  const [activeTab, setActiveTab] = useState(1);
  const [modalEvent, setModalEvent] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  // 1. PWA & Mobile App Settings Injection (ADD THIS)
  useEffect(() => {
    // 1-1. Meta tags for iOS/Android standalone mode
    const metaTags = [
      { name: 'apple-mobile-web-app-capable', content: 'yes' },
      { name: 'apple-mobile-web-app-status-bar-style', content: 'black-translucent' },
      { name: 'theme-color', content: '#2563EB' },
      // Important to prevent zooming which feels "web-like"
      { name: 'viewport', content: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no' }
    ];

    metaTags.forEach(tag => {
      let el = document.querySelector(`meta[name="${tag.name}"]`);
      if (!el) {
        el = document.createElement('meta');
        el.name = tag.name;
        document.head.appendChild(el);
      } else {
        el.content = tag.content; // Force update existing tags
      }
    });

    // 1-2. Dynamic Manifest for Android standalone mode
    const manifest = {
      name: "Nagoya Trip 2026",
      short_name: "NagoyaTrip",
      start_url: window.location.href, // Current URL
      display: "standalone",
      background_color: "#ffffff",
      theme_color: "#2563EB",
      icons: []
    };
    
    const stringManifest = JSON.stringify(manifest);
    const blob = new Blob([stringManifest], {type: 'application/json'});
    const manifestURL = URL.createObjectURL(blob);
    
    let linkEl = document.querySelector('link[rel="manifest"]');
    if (!linkEl) {
      linkEl = document.createElement('link');
      linkEl.rel = 'manifest';
      document.head.appendChild(linkEl);
    }
    linkEl.href = manifestURL;

  }, []);

  // 2. Authentication
  useEffect(() => {
    const initAuth = async () => {
      try {
        // シンプルに匿名認証のみ実行
        await signInAnonymously(auth);
      } catch (e) {
        setErrorMsg('認証エラー: オフラインの可能性があります');
        console.error(e);
      }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, (u) => setUser(u));
    return () => unsubscribe();
  }, []);

  // 3. Firestore Sync (Read)
  useEffect(() => {
    if (!user) return;

    // Use a fixed public path for sharing within "family" (anyone with this app link)
    // In a real app, we would use a shared family ID. Here we use a singleton "nagoya_2026" doc.
    const tripRef = doc(db, 'artifacts', appId, 'public', 'data', 'trips', 'nagoya_2026');

    const unsubscribe = onSnapshot(tripRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.tripData) {
          setTripData(data.tripData);
        }
      } else {
        // Create initial data if not exists
        setDoc(tripRef, { tripData: initialTripData }, { merge: true });
      }
      setIsSynced(true);
    }, (error) => {
      console.error("Sync error:", error);
      setErrorMsg('同期エラー: サーバーに接続できません');
    });

    return () => unsubscribe();
  }, [user]);

  // Update logic (Write to Firestore)
  const handleUpdateEvent = async (dayNum, eventId, updatedEvent) => {
    if (!user) return;

    const newTripData = tripData.map(day => {
      if (day.day === dayNum) {
        return {
          ...day,
          events: day.events.map(ev => ev.id === eventId ? updatedEvent : ev)
        };
      }
      return day;
    });

    // Optimistic Update
    setTripData(newTripData);
    if (modalEvent && modalEvent.id === eventId) {
        setModalEvent(updatedEvent);
    }

    // Write to Firestore
    try {
        const tripRef = doc(db, 'artifacts', appId, 'public', 'data', 'trips', 'nagoya_2026');
        await setDoc(tripRef, { tripData: newTripData }, { merge: true });
    } catch (e) {
        console.error("Save error:", e);
        setErrorMsg("保存に失敗しました");
    }
  };

  const handleSwapEvent = async (dayNum, eventId, selectedAlternative) => {
    if (!user) return;

    const newTripData = tripData.map(day => {
      if (day.day === dayNum) {
        return {
          ...day,
          events: day.events.map(ev => {
            if (ev.id === eventId) {
                return {
                    ...ev,
                    title: selectedAlternative.title,
                    details: {
                        ...ev.details,
                        description: selectedAlternative.description,
                        location: selectedAlternative.location
                    }
                }
            }
            return ev;
          })
        };
      }
      return day;
    });

    setTripData(newTripData);
    setModalEvent(null);

     // Write to Firestore
    try {
        const tripRef = doc(db, 'artifacts', appId, 'public', 'data', 'trips', 'nagoya_2026');
        await setDoc(tripRef, { tripData: newTripData }, { merge: true });
    } catch (e) {
        console.error("Save error:", e);
    }
  };
  
  // Reset Data Function (Hard Reset)
  const handleResetData = async () => {
    if (window.confirm('クラウド上のデータを初期状態に戻しますか？（他の端末のデータも戻ります）')) {
      if (!user) return;
      try {
        const tripRef = doc(db, 'artifacts', appId, 'public', 'data', 'trips', 'nagoya_2026');
        await setDoc(tripRef, { tripData: initialTripData });
        window.location.reload();
      } catch (e) {
        alert("リセットに失敗しました");
      }
    }
  };

  const currentDayData = tripData.find(d => d.day === activeTab);

  return (
    <div className="min-h-screen bg-slate-100 pb-10 font-sans text-gray-800">
      {/* Header */}
      <header className="bg-blue-600 text-white p-4 sticky top-0 z-20 shadow-lg safe-top">
        <div className="flex justify-between items-center max-w-2xl mx-auto">
          <div>
            <h1 className="text-xl font-bold tracking-tight flex items-center">
              Nagoya Trip 2026
              {isSynced ? 
                <Cloud size={14} className="ml-2 text-blue-200" /> : 
                <Loader2 size={14} className="ml-2 animate-spin text-blue-200" />
              }
            </h1>
            <p className="text-blue-100 text-xs">For Kazuhiko, Anri & Nagi</p>
          </div>
          <div className="text-right flex items-center gap-2">
             <button 
                onClick={handleResetData}
                className="p-1 bg-blue-700 rounded hover:bg-blue-800 text-white"
                title="初期化（全員分リセット）"
             >
                <RotateCcw size={16} />
             </button>
             {activeTab === 'budget' ? (
                <span className="bg-yellow-500 text-white px-2 py-1 rounded text-xs font-bold">予算モード</span>
             ) : (
                <span className="bg-blue-700 px-2 py-1 rounded text-xs font-mono">Day {activeTab}</span>
             )}
          </div>
        </div>
        {errorMsg && (
            <div className="bg-red-500 text-white text-xs p-1 text-center mt-1 rounded">
                {errorMsg}
            </div>
        )}
      </header>

      <main className="max-w-2xl mx-auto p-4 safe-bottom">
        
        {/* Tab Navigation */}
        <div className="flex space-x-2 overflow-x-auto pb-4 scrollbar-hide mb-2 sticky top-[72px] z-10 bg-slate-100/90 backdrop-blur-sm pt-2">
            {tripData.map(day => (
                <button
                key={day.day}
                onClick={() => setActiveTab(day.day)}
                className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-colors flex flex-col items-center leading-none ${
                    activeTab === day.day
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-white text-gray-500 hover:bg-gray-100 border border-gray-200'
                }`}
                >
                <span className="text-xs mb-1">Day {day.day}</span>
                <span className="text-[10px] font-normal opacity-90">{day.date.split(' ')[0].slice(5)}</span>
                </button>
            ))}

            <div className="flex items-center pl-2 border-l-2 border-gray-200 ml-2">
                <button
                    onClick={() => setActiveTab('budget')}
                    className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-colors flex items-center ${
                        activeTab === 'budget'
                        ? 'bg-yellow-500 text-white shadow-md'
                        : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                    }`}
                >
                    <Calculator size={14} className="mr-1"/> 旅費・予算
                </button>
            </div>
        </div>

        {/* Content Area */}
        {activeTab === 'budget' ? (
            <div className="animate-in fade-in duration-300">
                <FinancialSummary tripData={tripData} />
            </div>
        ) : (
            <div className="relative pl-4 border-l-2 border-gray-300 space-y-8 animate-in slide-in-from-right-4 duration-300">
            {currentDayData && currentDayData.events.map((event) => (
                <div key={event.id} className="relative">
                {/* Dot on timeline */}
                <div className={`absolute -left-[21px] top-4 w-4 h-4 rounded-full border-2 border-white shadow-sm z-10 ${
                    event.financial.isPaid ? 'bg-green-500' : 'bg-blue-600'
                }`}></div>

                {/* Event Card */}
                <div 
                    onClick={() => setModalEvent({ ...event, day: currentDayData.day })}
                    className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow cursor-pointer overflow-hidden group border border-gray-100"
                >
                    <div className="p-4 flex items-start gap-3">
                    {/* Time & Icon */}
                    <div className="flex flex-col items-center min-w-[50px]">
                        <span className="text-sm font-bold text-gray-600">{event.time}</span>
                        <div className="mt-2">
                        <EventIcon type={event.type} />
                        </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-gray-800 text-lg leading-tight mb-1">
                        {event.title}
                        </h3>
                        <p className="text-sm text-gray-500 truncate mb-2">
                        {event.details.description}
                        </p>
                        
                        {/* Tags */}
                        <div className="flex flex-wrap gap-2">
                        <span className={`text-xs px-2 py-1 rounded font-mono font-medium ${
                            event.financial.isPaid 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-orange-50 text-orange-600'
                        }`}>
                            {event.financial.amount === 0 ? 'FREE' : formatYen(event.financial.amount)}
                        </span>
                        {event.alternatives && (
                            <span className="text-xs px-2 py-1 rounded bg-yellow-100 text-yellow-700 flex items-center">
                            <RefreshCw size={10} className="mr-1" /> 切替可
                            </span>
                        )}
                         {/* Link/File Indicator */}
                        {event.details.link && (
                            <span className="text-xs px-2 py-1 rounded bg-indigo-50 text-indigo-600 flex items-center">
                                <ExternalLink size={10} className="mr-1" /> Link
                            </span>
                        )}
                        {/* Check Local Storage for file existence to show icon */}
                        {localStorage.getItem(`nagoya_trip_file_${event.id}`) && (
                            <span className="text-xs px-2 py-1 rounded bg-slate-100 text-slate-600 flex items-center">
                                <FileText size={10} className="mr-1" /> File
                            </span>
                        )}
                        </div>
                    </div>

                    {/* Arrow */}
                    <div className="self-center text-gray-300">
                        <ChevronDown className="-rotate-90 group-hover:text-blue-500 transition-colors" />
                    </div>
                    </div>
                </div>
                </div>
            ))}
            </div>
        )}
      </main>

      {/* Detail Modal */}
      <DetailModal 
        event={modalEvent} 
        isOpen={!!modalEvent} 
        onClose={() => setModalEvent(null)}
        onUpdate={handleUpdateEvent}
        onSwap={handleSwapEvent}
      />
    </div>
  );
}