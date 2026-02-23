/**
 * @jest-environment node
 */
// Route handlers use NextRequest (extends the Web Request API, available in Node 18+, not jsdom)
import { NextRequest } from "next/server";
import { POST } from "./route";

jest.mock("@/auth", () => ({ auth: jest.fn() }));
jest.mock("@vercel/blob", () => ({ put: jest.fn() }));

const { auth } = jest.requireMock("@/auth") as { auth: jest.Mock };
const { put } = jest.requireMock("@vercel/blob") as { put: jest.Mock };

const MOCK_UUID = "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee";

function makePdfFile(name = "form.pdf") {
  return new File(["%PDF-1.4"], name, { type: "application/pdf" });
}

function makeRequest(formData: FormData) {
  return new NextRequest("http://localhost/api/upload-pdf", {
    method: "POST",
    body: formData,
  });
}

beforeEach(() => {
  jest.clearAllMocks();
  jest
    .spyOn(globalThis.crypto, "randomUUID")
    .mockReturnValue(MOCK_UUID as ReturnType<typeof crypto.randomUUID>);
});

describe("POST /api/upload-pdf", () => {
  it("returns 401 when the user is not authenticated", async () => {
    auth.mockResolvedValue(null);

    const res = await POST(makeRequest(new FormData()));
    expect(res.status).toBe(401);
    expect(await res.json()).toMatchObject({ error: "Unauthorized" });
  });

  it("returns 400 when no file is provided", async () => {
    auth.mockResolvedValue({ user: { id: "user-1" } });

    const res = await POST(makeRequest(new FormData()));
    expect(res.status).toBe(400);
    expect(await res.json()).toMatchObject({ error: "A PDF file is required" });
  });

  it("returns 400 when the uploaded file is not a PDF", async () => {
    auth.mockResolvedValue({ user: { id: "user-1" } });

    const formData = new FormData();
    formData.append(
      "file",
      new File(["content"], "notes.txt", { type: "text/plain" }),
    );

    const res = await POST(makeRequest(formData));
    expect(res.status).toBe(400);
    expect(await res.json()).toMatchObject({ error: "A PDF file is required" });
  });

  it("stores the file under submissions/<submissionId>.pdf when submissionId is provided", async () => {
    auth.mockResolvedValue({ user: { id: "user-1" } });
    put.mockResolvedValue({ url: "https://blob.vercel.com/submissions/sub-123.pdf" });

    const formData = new FormData();
    formData.append("file", makePdfFile());
    formData.append("submissionId", "sub-123");

    const res = await POST(makeRequest(formData));

    expect(put).toHaveBeenCalledWith(
      "submissions/sub-123.pdf",
      expect.anything(),
      expect.objectContaining({ access: "public" }),
    );
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      url: "https://blob.vercel.com/submissions/sub-123.pdf",
    });
  });

  it("uses a random UUID as the key when no submissionId is provided", async () => {
    auth.mockResolvedValue({ user: { id: "user-1" } });
    put.mockResolvedValue({
      url: `https://blob.vercel.com/submissions/${MOCK_UUID}.pdf`,
    });

    const formData = new FormData();
    formData.append("file", makePdfFile());

    await POST(makeRequest(formData));

    expect(put).toHaveBeenCalledWith(
      `submissions/${MOCK_UUID}.pdf`,
      expect.anything(),
      expect.anything(),
    );
  });

  it("returns the blob URL on success", async () => {
    auth.mockResolvedValue({ user: { id: "user-1" } });
    put.mockResolvedValue({ url: "https://blob.vercel.com/submissions/sub-123.pdf" });

    const formData = new FormData();
    formData.append("file", makePdfFile());
    formData.append("submissionId", "sub-123");

    const res = await POST(makeRequest(formData));
    expect(await res.json()).toEqual({
      url: "https://blob.vercel.com/submissions/sub-123.pdf",
    });
  });
});
