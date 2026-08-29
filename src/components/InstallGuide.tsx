type Props = {
  canInstall: boolean
  installed: boolean
  onBack: () => void
  onInstallApp: () => void
}

export function InstallGuide({ canInstall, installed, onBack, onInstallApp }: Props) {
  return (
    <main className="page-shell install-page">
      <header className="page-header">
        <button className="back-btn" onClick={onBack}>← 처음으로</button>
        <div>
          <p className="eyebrow">휴대폰에서도 모험하기</p>
          <h1>게임 설치 안내</h1>
        </div>
      </header>

      <section className="install-card" aria-labelledby="install-title">
        <div className="install-icon" aria-hidden="true">📲</div>
        <div>
          <h2 id="install-title">홈 화면에 추가하면 앱처럼 열려요</h2>
          <p>
            {installed
              ? '이미 앱처럼 실행되고 있어요. 홈 화면 아이콘으로 언제든 다시 들어올 수 있어요.'
              : '휴대폰 브라우저에서 홈 화면에 추가하면, 아이콘을 눌러 바로 시작할 수 있어요. 기록은 이 기기에 저장됩니다.'}
          </p>
        </div>
      </section>

      {canInstall && (
        <button className="primary-btn install-now" onClick={onInstallApp}>
          지금 이 기기에 앱 설치
        </button>
      )}

      <section className="install-steps" aria-label="설치 절차">
        <article>
          <span>1</span>
          <div>
            <h2>게임 주소를 휴대폰에서 열어요</h2>
            <p>같은 Wi-Fi의 개발 주소 또는 배포된 페이지를 Chrome 또는 Safari로 열어 주세요.</p>
          </div>
        </article>
        <article>
          <span>2</span>
          <div>
            <h2>브라우저 메뉴를 열어요</h2>
            <p><b>안드로이드 Chrome</b>에서는 ⋮ 메뉴를, <b>아이폰 Safari</b>에서는 공유 버튼 □↑을 눌러요.</p>
          </div>
        </article>
        <article>
          <span>3</span>
          <div>
            <h2>홈 화면에 추가해요</h2>
            <p><b>‘앱 설치’ 또는 ‘홈 화면에 추가’</b>를 선택하면 바탕화면에 게임 아이콘이 생겨요.</p>
          </div>
        </article>
        <article>
          <span>4</span>
          <div>
            <h2>아이콘을 눌러 모험을 시작해요</h2>
            <p>추가된 아이콘으로 실행하면 전체 화면 앱처럼 편하게 다시 들어올 수 있어요.</p>
          </div>
        </article>
      </section>

      <section className="install-note">
        <strong>알아두세요</strong>
        <p>
          스테이지 플레이는 휴대폰을 가로로 들고 진행해요. 안드로이드 테스트 APK는 GitHub Actions 산출물에서 받을 수 있습니다.
        </p>
      </section>

      <button className="primary-btn install-back" onClick={onBack}>
        게임 시작 화면으로
      </button>
    </main>
  )
}
