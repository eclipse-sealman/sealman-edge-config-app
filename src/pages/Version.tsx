export default function Version() {

  return (
    <>
      <div>Version: {import.meta.env.VITE_VERSION || 'local_development'}</div>
    </>
  )
}
