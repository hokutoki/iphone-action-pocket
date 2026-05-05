# 一手ログ

iPhoneで今日の一手を選び、短く記録する単独稼働Webアプリです。

## 単独稼働の方針

- Mac、Codex、ログイン、常駐サーバーなしで使う設計です。
- 記録、今日の一手、履歴はブラウザ内の `localStorage` に保存します。
- 設定タブからバックアップJSONを書き出し、必要なときに復元できます。
- HTTPSで公開すると、PWAとしてホーム画面追加とService Workerキャッシュを使えます。
- `file://` 直開きでも基本機能は動きますが、PWA機能はHTTPS公開時の確認を推奨します。

## GitHub Pagesで公開する方法

### 方法A: このフォルダをリポジトリのルートにする

1. `iphone_action_pocket` の中身を新しいGitHubリポジトリのルートに置きます。
2. GitHubで `Settings` -> `Pages` を開きます。
3. `Build and deployment` の `Source` を `Deploy from a branch` にします。
4. `Branch` を `main`、フォルダを `/ (root)` にします。
5. 表示されたGitHub Pages URLをiPhone Safariで開きます。
6. Safariの共有ボタンから「ホーム画面に追加」を選びます。

### 方法B: 既存リポジトリのサブフォルダで公開する

1. 既存リポジトリに `docs/` フォルダを作ります。
2. `iphone_action_pocket` の中身を `docs/` にコピーします。
3. GitHubで `Settings` -> `Pages` を開きます。
4. `Branch` を `main`、フォルダを `/docs` にします。
5. 表示されたGitHub Pages URLをiPhone Safariで開きます。

## 公開前チェック

- `index.html` が開ける
- `styles.css` と `app.js` が読み込まれる
- 候補生成が動く
- 記録追加が動く
- 設定タブのバックアップJSON書き出しが動く
- `manifest.webmanifest` が読み込まれる
- `icons/` のPNGアイコンが読み込まれる
- HTTPS URLで開いたときにホーム画面追加できる

## ローカル確認

このフォルダで以下を実行すると、ローカル確認できます。

```sh
python3 -m http.server 4174
```

ブラウザで開くURL:

```text
http://localhost:4174/
```

同じWi-FiのiPhoneから確認する場合は、MacのLAN内IPを使います。

```text
http://<MacのIPアドレス>:4174/
```

## データの扱い

記録は端末内保存です。GitHub Pagesへ公開しても、記録データがGitHubへ送信される設計ではありません。

機種変更、Safariデータ削除、別ブラウザ利用に備える場合は、設定タブでバックアップJSONを書き出してください。
