# 무지개 점프 대모험

통통 뛰며 깃발까지 달리는 점프 어드벤처입니다.
휴대폰에서는 **플레이 중 가로 화면**으로 진행됩니다.

## Expo Go로 테스트

일상기도(`daily-prayer`)처럼 **Expo Go**로 휴대폰에서 바로 열어볼 수 있습니다.

1. 휴대폰에 [Expo Go](https://expo.dev/go)를 설치합니다.
2. 프로젝트 폴더에서:

```bash
npm install
npm run expo
```

3. 터미널에 나온 QR 코드를 Expo Go로 스캔합니다.

Expo 프로젝트: https://expo.dev/accounts/shshmy/projects/rainbow-jump

플레이 화면은 가로로 고정됩니다. 계정은 `shshmy` Expo 프로젝트 `rainbow-jump`로 연결됩니다.

## 웹으로 실행

```bash
npm install
npm run dev
```

- PC: `http://localhost:5173`
- 같은 Wi-Fi 휴대폰: 터미널에 표시된 네트워크 주소

기록은 이 기기에 저장되므로 백엔드 없이도 플레이할 수 있습니다.

## 테스트 APK 설치

GitHub Actions가 디버그 APK를 만듭니다.

1. 저장소 **Actions** 탭에서 `Build debug APK` 워크플로를 엽니다.
2. 최신 실행이 초록색인지 확인한 뒤 **Artifacts**에서 `rainbow-jump-debug-apk`를 받습니다.
3. 압축을 풀고 `app-debug.apk`를 휴대폰으로 보냅니다.
4. 안드로이드에서 **알 수 없는 앱 설치**를 허용한 뒤 APK를 설치합니다.

직접 다시 만들려면 Actions에서 `Run workflow`를 누르거나, Android Studio가 있는 PC에서:

```bash
npm run cap:sync
npx cap open android
```

## 웹 앱으로 설치

휴대폰 브라우저에서 **홈 화면에 추가**하면 PWA로도 실행됩니다.
메뉴는 세로, 스테이지 플레이는 가로입니다.

## 조작

- 이동: ← → 또는 화면 버튼
- 점프: ↑ / 스페이스
- 앉기: ↓
- 대시: M
- 공격: N

15개 스테이지, 4가지 테마가 있습니다.
