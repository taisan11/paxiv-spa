import { createSignal, onMount, type Component } from "solid-js";
import { getAuth, setAuth, clearAuth } from "../lib/auth";
import { CORS_PROXIES, getSelectedProxy, setSelectedProxy, getCustomProxyUrl, setCustomProxyUrl, type CorsProxyId } from "../lib/fetch";

const Setting: Component = () => {
  const auth = getAuth();
  const [phpsessid, setPhpsessid] = createSignal(auth.PHPSESSID ?? "");
  const [csrfToken, setCsrfToken] = createSignal(auth.csrfToken ?? "");
  const [userId, setUserId] = createSignal(auth.userId ?? "");
  const [saved, setSaved] = createSignal(false);
  const [cacheSize, setCacheSize] = createSignal("計算中...");
  const [proxyId, setProxyId] = createSignal<CorsProxyId>(getSelectedProxy());
  const [customUrl, setCustomUrl] = createSignal(getCustomProxyUrl());

  const calculateCacheSize = async () => {
    if ("storage" in navigator && "estimate" in navigator.storage) {
      const { usage } = await navigator.storage.estimate();
      setCacheSize(`${((usage ?? 0) / 1024 / 1024).toFixed(1)} MB`);
    } else {
      setCacheSize("非対応");
    }
  };

  const clearAllCaches = async () => {
    const keys = await caches.keys();
    await Promise.all(keys.map((k) => caches.delete(k)));
    const reg = await navigator.serviceWorker?.getRegistration();
    if (reg) await reg.update();
    setCacheSize("0 MB");
  };

  onMount(calculateCacheSize);

  const handleLogin = (e: Event) => {
    e.preventDefault();
    setAuth({
      PHPSESSID: phpsessid() || undefined,
      csrfToken: csrfToken() || undefined,
      userId: userId() || undefined
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleClear = () => {
    clearAuth();
    setPhpsessid("");
    setCsrfToken("");
    setUserId("");
  };

  const handleThemeChange = (e: Event) => {
    const value = (e.target as HTMLSelectElement).value;
    if (value === "dark") {
      document.documentElement.setAttribute("data-theme", "dark");
    } else if (value === "light") {
      document.documentElement.setAttribute("data-theme", "light");
    } else {
      document.documentElement.removeAttribute("data-theme");
    }
    localStorage.setItem("theme", value);
  };

  const savedTheme = localStorage.getItem("theme") || "auto";

  return (
    <>
      <h1>設定</h1>
      <a href="/">トップページに戻る</a>
      <h2>レイアウト</h2>
      <p>カラーテーマを選択してください。</p>
      <select name="thema" onChange={handleThemeChange} value={savedTheme}>
        <option value="light">ライト</option>
        <option value="dark">ダーク</option>
        <option value="auto">自動</option>
      </select>

      <h2>CORSプロキシ</h2>
      <p>画像・APIリクエストに使用するCORSプロキシを選択してください。</p>
      <select value={proxyId()} onChange={(e) => {
        const v = e.currentTarget.value as CorsProxyId;
        setProxyId(v);
        setSelectedProxy(v);
      }}>
        {CORS_PROXIES.map((p) => <option value={p.id}>{p.name}</option>)}
      </select>
      {proxyId() === "custom" && (
        <div style={{ "margin-top": "0.5rem" }}>
          <input
            type="text"
            placeholder="https://example.com/?url="
            value={customUrl()}
            onInput={(e) => {
              setCustomUrl(e.currentTarget.value);
              setCustomProxyUrl(e.currentTarget.value);
            }}
            style={{ width: "100%", "max-width": "400px" }}
          />
          <p style={{ "font-size": "0.85rem", color: "var(--text-secondary)" }}>
            {`プロキシURL末尾に「?url=」を含めてください。例: https://example.com/?url=`}
          </p>
        </div>
      )}

      <h2>小説の表示設定</h2>
      <p>小説ページでのテキスト表示設定です。設定はブラウザに保存されます。</p>
      <div>
        <label for="novel-font-family">フォント: </label>
        <select name="novel-font-family" id="novel-font-family">
          <option value="serif">明朝体（serif）</option>
          <option value="sans-serif">ゴシック体（sans-serif）</option>
          <option value="monospace">等幅（monospace）</option>
        </select>
      </div>
      <div>
        <label for="novel-font-size">文字サイズ: </label>
        <select name="novel-font-size" id="novel-font-size">
          <option value="small">小（14px）</option>
          <option value="medium">中（16px）</option>
          <option value="large">大（18px）</option>
          <option value="xlarge">特大（22px）</option>
        </select>
      </div>
      <div>
        <label for="novel-line-height">行間: </label>
        <select name="novel-line-height" id="novel-line-height">
          <option value="compact">狭め</option>
          <option value="normal">標準</option>
          <option value="wide">広め</option>
        </select>
      </div>
      <div>
        <label for="novel-letter-spacing">文字間隔: </label>
        <select name="novel-letter-spacing" id="novel-letter-spacing">
          <option value="normal">標準</option>
          <option value="wide">少し広め</option>
          <option value="wider">広め</option>
        </select>
      </div>

      <h2>ログイン情報</h2>
      <p>ログイン情報はブラウザのlocalStorageに保存されます。</p>
      <p>
        <strong>Pixiv認証について:</strong><br />
        HAR上では、認証付きAPIで <code>PHPSESSID</code>（Cookie）と <code>x-user-id</code> が継続的に送信され、
        書き込み系では <code>X-Csrf-Token</code> も付与されます。<br />
        Paxivではこの3つを保存すると、必要な <code>accept</code> / <code>accept-language</code> /
        <code>referer</code> / <code>origin</code> ヘッダーと合わせて自動で付与します。<br />
        <code>X-Csrf-Token</code> は下記のスクリプトをPixivのページで実行して取得できます。
      </p>
      <pre>
        {`console.log(JSON.parse(JSON.parse(document.getElementById('__NEXT_DATA__').innerHTML).props.pageProps.serverSerializedPreloadedState).api.token)`}
      </pre>
      <form onSubmit={handleLogin}>
        <label>
          <span>PHPSESSID Cookie:</span>
          <input type="text" value={phpsessid()} onInput={(e) => setPhpsessid(e.currentTarget.value)} />
        </label><br />
        <label>
          <span>X-Csrf-Token ヘッダー:</span>
          <input type="text" value={csrfToken()} onInput={(e) => setCsrfToken(e.currentTarget.value)} />
        </label><br />
        <label>
          <span>PixivのユーザーID:</span>
          <input type="text" value={userId()} onInput={(e) => setUserId(e.currentTarget.value)} />
        </label><br />
        <button type="submit">ログイン</button>
        {saved() && <span style={{ "margin-left": "0.5rem", color: "green" }}>保存しました</span>}
      </form>
      <button onClick={handleClear} style={{ "margin-top": "0.5rem" }}>ログアウト</button>

      <h2>キャッシュ管理</h2>
      <p>現在のキャッシュサイズ: {cacheSize()}</p>
      <button onClick={clearAllCaches}>すべてのキャッシュを削除</button>
    </>
  );
};

export default Setting;
