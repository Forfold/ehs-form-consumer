import { uploadPdf } from "./uploadPdf";

describe("uploadPdf", () => {
  beforeEach(() => {
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("sends a POST request to /api/upload-pdf with the file", async () => {
    const mockFetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ url: "https://blob.vercel.com/test.pdf" }),
    });
    global.fetch = mockFetch;

    const file = new File(["content"], "test.pdf", { type: "application/pdf" });
    const result = await uploadPdf(file);

    expect(mockFetch).toHaveBeenCalledWith(
      "/api/upload-pdf",
      expect.objectContaining({ method: "POST" }),
    );
    expect(result).toBe("https://blob.vercel.com/test.pdf");
  });

  it("appends the file to the FormData body", async () => {
    const mockFetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ url: "https://blob.vercel.com/test.pdf" }),
    });
    global.fetch = mockFetch;

    const file = new File(["content"], "test.pdf", { type: "application/pdf" });
    await uploadPdf(file);

    const body = mockFetch.mock.calls[0][1].body as FormData;
    expect(body.get("file")).toBe(file);
  });

  it("includes submissionId in FormData when provided", async () => {
    const mockFetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ url: "https://blob.vercel.com/test.pdf" }),
    });
    global.fetch = mockFetch;

    const file = new File(["content"], "test.pdf", { type: "application/pdf" });
    await uploadPdf(file, "sub-123");

    const body = mockFetch.mock.calls[0][1].body as FormData;
    expect(body.get("submissionId")).toBe("sub-123");
  });

  it("does not include submissionId when not provided", async () => {
    const mockFetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ url: "https://blob.vercel.com/test.pdf" }),
    });
    global.fetch = mockFetch;

    const file = new File(["content"], "test.pdf", { type: "application/pdf" });
    await uploadPdf(file);

    const body = mockFetch.mock.calls[0][1].body as FormData;
    expect(body.get("submissionId")).toBeNull();
  });

  it("throws when the response is not ok", async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: false });

    const file = new File(["content"], "test.pdf", { type: "application/pdf" });
    await expect(uploadPdf(file)).rejects.toThrow("PDF upload failed");
  });
});
