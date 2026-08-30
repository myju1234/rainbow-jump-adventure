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

## 설치 파일(APK) 받기

휴대폰 브라우저에서 아래 주소를 열면 **항상 최신 설치 파일**이 바로 내려받아집니다.
GitHub 로그인도, 압축 풀기도 필요 없습니다.

**https://github.com/myju1234/rainbow-jump-adventure/releases/latest/download/rainbow-jump.apk**

1. 위 주소를 휴대폰에서 엽니다.
2. 다운로드된 `rainbow-jump.apk`를 누릅니다.
3. 안드로이드가 물어보면 **알 수 없는 앱 설치**를 허용합니다.
4. 이미 깔려 있다면 그 위에 덮어써서 업데이트됩니다.

`main`에 새 커밋을 올릴 때마다 GitHub Actions가 APK를 다시 만들어
[releases/latest](https://github.com/myju1234/rainbow-jump-adventure/releases/latest)의 파일을 교체합니다.
주소는 그대로이니 즐겨찾기해 두면 됩니다.

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
- 대시: M (한 번 누르면 켜지고, 한 번 더 누르면 꺼지는 토글)
- 공격: N

## 체크포인트

스테이지를 약 1400px 간격으로 나눈 지점마다 체크포인트 깃발(🏳️)이 서 있고,
지나가면 초록 깃발(⛳)로 바뀌면서 저장됩니다. 마지막 하나는 항상 보스 방 입구에 놓입니다.

- 목숨을 하나 잃어도 스테이지 처음이 아니라 **마지막 체크포인트**에서 다시 시작합니다.
- 그때까지 모은 점수·동전·아이템은 그대로 유지됩니다.
- 목숨을 모두 잃어도 실패 화면에서 **체크포인트에서 이어하기**를 고르면 목숨 3개로 그 자리에서 다시 도전할 수 있습니다.
- 체크포인트 위치는 `scripts/check-checkpoints.mjs`로 낭떠러지·보스와 겹치지 않는지 검사할 수 있습니다.

## 보스전

각 스테이지 마지막 깃발 앞에는 보스가 지키고 서 있습니다.

- 보스 체력은 **100**이고, 공격(N)이 한 번 맞을 때마다 **10씩** 깎입니다. 즉 10번 맞히면 쓰러집니다.
- 공격은 보스에게서 **150px 안**이면 닿습니다. 사정거리에 들어오면 보스 둘레에 흰 점선 조준 원이 돕니다.
- 보스는 길을 막지만 **부딪혀도 다치지 않습니다.** 앞에서 그냥 멈춥니다.
- 대신 보스는 2.8초마다 **"점프 준비!"** 경고를 띄운 뒤 땅으로 **충격파(💥)** 를 보냅니다.
  땅에 서 있으면 목숨이 하나 줄고, **점프해 있으면 그대로 지나갑니다.**
- 충격파에 맞으면 뒤로 밀려나며 1.5초 무적이 됩니다. 체크포인트로 되돌아가지는 않습니다.
- 보스를 쓰러뜨리면 보너스 점수 **+1000**을 받습니다.

## 아이콘 다시 만들기

`assets/icon-source.png`(여우 원본)와 `assets/icon-source-maskable.png`를 교체한 뒤 아래를 실행하면
Expo·PWA·안드로이드 런처 아이콘이 모두 다시 생성됩니다.

```powershell
powershell -ExecutionPolicy Bypass -File scripts/make-icons.ps1
```

15개 스테이지, 4가지 테마가 있습니다.
