import { useState, useEffect } from 'react';
import TripApp from './TripApp.jsx';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  // ブラウザに「合言葉」を覚えているか確認
  useEffect(() => {
    const savedAuth = localStorage.getItem('trip_auth');
    if (savedAuth === 'nagoya') {
      setIsAuthenticated(true);
    }
  }, []);

  const handleLogin = (e) => {
    e.preventDefault();
    // ★ここで合言葉を設定（今は nagoya にしています）
    if (password === 'nagoya') {
      localStorage.setItem('trip_auth', 'nagoya'); // 次回から入力を省略
      setIsAuthenticated(true);
    } else {
      setError('合言葉が違います');
    }
  };

  // 合言葉が合っていれば、いつものアプリを表示
  if (isAuthenticated) {
    return <TripApp />;
  }

  // 合言葉がまだなら、鍵の画面を表示
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-sm">
        <h1 className="text-2xl font-bold text-center mb-6 text-gray-800">
          Nagoya Trip 2026
        </h1>
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              合言葉
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:outline-none"
              placeholder="パスワードを入力"
            />
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition-colors font-bold"
          >
            ロック解除
          </button>
        </form>
      </div>
    </div>
  );
}