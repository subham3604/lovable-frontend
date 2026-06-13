const token = "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ0ZXN0QGV4YW1wbGUuY29tIiwidXNlcklkIjoiMyIsImlhdCI6MTc4MTI1NzM4NiwiZXhwIjoxNzgxMjU4NTg2fQ.aQWrfrgjjeGHtem5Uul9N_Tk9DFeU2eHeRLgYIvqs1E";
const BASE_URL = "http://localhost:8080";

async function main() {
  const response = await fetch(`${BASE_URL}/api/chat/stream`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
    body: JSON.stringify({ message: "hi", projectId: "1" }),
  });

  if (!response.ok) {
    console.error("HTTP error:", response.status, await response.text());
    return;
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    console.log("CHUNK:", JSON.stringify(decoder.decode(value)));
  }

  console.log("STREAM END");
}

main().catch(console.error);
