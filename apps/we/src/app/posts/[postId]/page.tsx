export default async function Page({ params }: { params: Promise<{ postId: string }> }) {
  const slug = (await params).postId;
  return <div>My Post: {slug}</div>;
}
