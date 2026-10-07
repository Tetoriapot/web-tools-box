export function ErrorNotice({ message, id }: { message: string; id?: string }) {
  return message ? (
    <p className="error-notice" role="alert" id={id}>
      {message}
    </p>
  ) : null;
}
