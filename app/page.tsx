export default function Home() {
  return (
    <main style={{ maxWidth: 640, margin: '0 auto', padding: '2rem 1.25rem' }}>
      <h1 style={{ fontSize: '2rem', marginBottom: '1rem' }}>AI Scrum テンプレート</h1>
      <p style={{ marginBottom: '1rem' }}>
        このリポジトリはスクラム自動化を最小構成で始めるためのひな形です。
        <code style={{ marginLeft: 4, marginRight: 4 }}>domains/&lt;ドメイン名&gt;/&lt;ドメイン名&gt;-plan.md</code>
        に計画書を追加し、
        <code style={{ marginLeft: 4 }}>npm run domain domains/&lt;ドメイン名&gt;/&lt;ドメイン名&gt;-plan.md</code>
        を実行すればエージェントがスクラムを開始します。
      </p>
      <p style={{ marginBottom: '1rem' }}>
        実行ログや成果物は <code>out/</code> 配下に保存され、バックログやタスクは
        <code>out/po/</code> と <code>out/planner/</code> に、生成ドキュメントは <code>docs/</code> にまとめられます。
        これらは各実行ごとに削除して構いません。
      </p>
      <p style={{ marginBottom: '1rem' }}>
        まずは簡潔なドメイン仕様を作成してください。`domains/examples/` のサンプルを参考にできます。
      </p>
    </main>
  )
}
