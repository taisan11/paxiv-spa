## 認証について
HARベースで確認したPixivの`/ajax`通信では、主に`PHPSESSID`(Cookie)と`x-user-id`が使われ、
POST系エンドポイントでは`X-Csrf-Token`が追加されます。
Paxivはこれらが設定されている場合に、`accept`/`accept-language`/`referer`/`origin`なども合わせて送信します。
X-Csrf-Tokenはブラウザで下記のスクリプトを実行することで取得できます。
X-Csrf-Tokenは未ログイン時はランダムに変わります。
`console.log(JSON.parse(JSON.parse(document.getElementById('__NEXT_DATA__').innerHTML).props.pageProps.serverSerializedPreloadedState).api.token)`
