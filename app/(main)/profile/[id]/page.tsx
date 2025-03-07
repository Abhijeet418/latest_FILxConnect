interface UserPageProps {
    params: { id: string };
  }
  
  export default function UserPage({ params }: UserPageProps) {
    return <h1>User ID: {params.id}</h1>;
  }
  