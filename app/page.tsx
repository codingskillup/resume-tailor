"use client";

import { useState } from "react";
import { jsPDF } from "jspdf";

type TailorResult = {
  role: string;
  company: string;
  salary: string;
  matchScore: number;
  matchedSkills: string[];
  missingSkills: string[];
  tailoredResume: string;
};

type InterviewQuestion = {
  question: string;
  answer: string;
  type: string;
};

export default function Home() {
  const [resumeName, setResumeName] = useState("");
  const [resume, setResume] = useState("");
  const [job, setJob] = useState("");

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TailorResult | null>(null);
  const [error, setError] = useState("");

  const [pdfLoading, setPdfLoading] = useState(false);

  const [coverLetter, setCoverLetter] = useState("");
  const [coverLoading, setCoverLoading] = useState(false);
  const [coverError, setCoverError] = useState("");

  const [interviewQuestions, setInterviewQuestions] = useState<
    InterviewQuestion[]
  >([]);

  const [interviewLoading, setInterviewLoading] =
    useState(false);

  const [interviewError, setInterviewError] =
    useState("");

  const ready =
    resumeName.trim().length > 0 &&
    resume.trim().length > 0 &&
    job.trim().length > 0;

  const tailorResume = async () => {
    if (!ready || loading) return;

    try {
      setLoading(true);
      setError("");

      setResult(null);
      setCoverLetter("");
      setCoverError("");
      setInterviewQuestions([]);
      setInterviewError("");

      const response = await fetch("/api/tailor", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          resumeName,
          resume,
          job,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Unable to tailor your resume."
        );
      }

      setResult(data);

      setTimeout(() => {
        document
          .getElementById("result")
          ?.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
      }, 100);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const downloadPDF = () => {
    if (
      !result?.tailoredResume ||
      pdfLoading
    ) {
      return;
    }

    try {
      setPdfLoading(true);

      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const pageWidth =
        pdf.internal.pageSize.getWidth();

      const pageHeight =
        pdf.internal.pageSize.getHeight();

      const left = 18;
      const right = 18;
      const top = 18;
      const bottom = 18;

      const contentWidth =
        pageWidth - left - right;

      let y = top;

      const addPageIfNeeded = (
        height = 8
      ) => {
        if (
          y + height >
          pageHeight - bottom
        ) {
          pdf.addPage();
          y = top;
        }
      };

      pdf.setTextColor(20, 20, 25);

      pdf.setFont(
        "helvetica",
        "bold"
      );

      pdf.setFontSize(20);

      pdf.text(
        resumeName.trim() ||
          "Resume",
        left,
        y
      );

      y += 8;

      if (result.role) {
        pdf.setFont(
          "helvetica",
          "normal"
        );

        pdf.setFontSize(10);

        pdf.setTextColor(
          90,
          90,
          100
        );

        pdf.text(
          result.role,
          left,
          y
        );

        y += 7;
      }

      pdf.setDrawColor(
        220,
        220,
        225
      );

      pdf.line(
        left,
        y,
        pageWidth - right,
        y
      );

      y += 8;

      pdf.setTextColor(
        30,
        30,
        35
      );

      const resumeLines =
        result.tailoredResume.split(
          "\n"
        );

      resumeLines.forEach(
        (rawLine) => {
          const line =
            rawLine.trim();

          if (!line) {
            y += 3.5;
            return;
          }

          const isHeading =
            line ===
              line.toUpperCase() &&
            line.length <= 45 &&
            /[A-Z]/.test(line);

          if (isHeading) {
            addPageIfNeeded(12);

            y += 2;

            pdf.setFont(
              "helvetica",
              "bold"
            );

            pdf.setFontSize(11);

            pdf.setTextColor(
              35,
              35,
              40
            );

            pdf.text(
              line,
              left,
              y
            );

            y += 5;

            pdf.setDrawColor(
              230,
              230,
              235
            );

            pdf.line(
              left,
              y,
              pageWidth - right,
              y
            );

            y += 5;

            return;
          }

          pdf.setFont(
            "helvetica",
            "normal"
          );

          pdf.setFontSize(9.5);

          pdf.setTextColor(
            45,
            45,
            50
          );

          const wrapped =
            pdf.splitTextToSize(
              line,
              contentWidth
            );

          const lineHeight =
            4.7;

          const requiredHeight =
            wrapped.length *
            lineHeight;

          addPageIfNeeded(
            requiredHeight + 2
          );

          pdf.text(
            wrapped,
            left,
            y
          );

          y +=
            requiredHeight + 1.5;
        }
      );

      const safeName =
        (
          resumeName ||
          "Resume"
        )
          .trim()
          .replace(
            /[^a-zA-Z0-9]+/g,
            "_"
          )
          .replace(
            /^_+|_+$/g,
            ""
          );

      const safeRole =
        (
          result.role ||
          "Tailored"
        )
          .trim()
          .replace(
            /[^a-zA-Z0-9]+/g,
            "_"
          )
          .replace(
            /^_+|_+$/g,
            ""
          );

      pdf.save(
        `${safeName}_${safeRole}_Resume.pdf`
      );
    } catch (err) {
      console.error(
        "PDF error:",
        err
      );

      setError(
        "Unable to create the PDF. Please try again."
      );
    } finally {
      setPdfLoading(false);
    }
  };

  const generateCoverLetter =
    async () => {
      if (
        !result ||
        coverLoading
      ) {
        return;
      }

      try {
        setCoverLoading(true);
        setCoverError("");

        const response =
          await fetch(
            "/api/cover-letter",
            {
              method: "POST",
              headers: {
                "Content-Type":
                  "application/json",
              },
              body: JSON.stringify({
                resumeName,
                tailoredResume:
                  result.tailoredResume,
                job,
                role: result.role,
                company:
                  result.company,
              }),
            }
          );

        const data =
          await response.json();

        if (!response.ok) {
          throw new Error(
            data.error ||
              "Unable to generate cover letter."
          );
        }

        setCoverLetter(
          data.coverLetter
        );
      } catch (err) {
        setCoverError(
          err instanceof Error
            ? err.message
            : "Something went wrong."
        );
      } finally {
        setCoverLoading(false);
      }
    };

  const generateInterviewPrep =
    async () => {
      if (
        !result ||
        interviewLoading
      ) {
        return;
      }

      try {
        setInterviewLoading(true);
        setInterviewError("");

        const response =
          await fetch(
            "/api/interview",
            {
              method: "POST",
              headers: {
                "Content-Type":
                  "application/json",
              },
              body: JSON.stringify({
                resumeName,
                tailoredResume:
                  result.tailoredResume,
                job,
                role: result.role,
                company:
                  result.company,
              }),
            }
          );

        const data =
          await response.json();

        if (!response.ok) {
          throw new Error(
            data.error ||
              "Unable to generate interview preparation."
          );
        }

        setInterviewQuestions(
          data.questions || []
        );
      } catch (err) {
        setInterviewError(
          err instanceof Error
            ? err.message
            : "Something went wrong."
        );
      } finally {
        setInterviewLoading(false);
      }
    };

  return (
    <main className="min-h-screen bg-[#f7f8fa] text-[#16181d]">
      <div className="mx-auto max-w-[1280px] px-5 py-10 md:px-8 md:py-14">

        <header className="mb-10">
          <div className="mb-4 inline-flex rounded-full border border-[#e5e7eb] bg-white px-3 py-1 text-xs font-medium text-[#60646c] shadow-sm">
            AI Resume Builder
          </div>

          <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
            Tailor your resume
            <span className="text-[#6d5dfc]">
              {" "}
              for the job.
            </span>
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-[#686b73] md:text-base">
            Add your current resume and
            the job you want. AI will
            create a focused version
            while keeping your real
            experience intact.
          </p>
        </header>

        <div className="grid gap-6 lg:grid-cols-2">

          <section className="rounded-2xl border border-[#e3e5e8] bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)] md:p-7">

            <div className="mb-6 flex items-start gap-4">

              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#f0efff] text-sm font-semibold text-[#6254e8]">
                01
              </div>

              <div>
                <h2 className="text-lg font-semibold">
                  Source resume
                </h2>

                <p className="mt-1 text-sm text-[#74777f]">
                  Paste the resume you
                  want to improve.
                </p>
              </div>

            </div>

            <label className="mb-2 block text-sm font-medium">
              Resume name
            </label>

            <input
              value={resumeName}
              onChange={(e) =>
                setResumeName(
                  e.target.value
                )
              }
              placeholder="e.g. Zohaib"
              className="mb-5 h-12 w-full rounded-xl border border-[#dedfe3] bg-white px-4 text-sm outline-none transition focus:border-[#7467f0] focus:ring-4 focus:ring-[#7467f0]/10"
            />

            <div className="mb-2 flex items-center justify-between">

              <label className="text-sm font-medium">
                Resume content
              </label>

              <span className="text-xs text-[#90939a]">
                {resume.length} characters
              </span>

            </div>

            <textarea
              value={resume}
              onChange={(e) =>
                setResume(
                  e.target.value
                )
              }
              placeholder="Paste your current resume here..."
              className="min-h-[360px] w-full resize-none rounded-xl border border-[#dedfe3] bg-white p-4 text-sm leading-6 outline-none transition focus:border-[#7467f0] focus:ring-4 focus:ring-[#7467f0]/10"
            />

          </section>

          <section className="rounded-2xl border border-[#e3e5e8] bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)] md:p-7">

            <div className="mb-6 flex items-start gap-4">

              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#f0efff] text-sm font-semibold text-[#6254e8]">
                02
              </div>

              <div>
                <h2 className="text-lg font-semibold">
                  Target job
                </h2>

                <p className="mt-1 text-sm text-[#74777f]">
                  Paste the complete
                  job description.
                </p>
              </div>

            </div>

            <div className="mb-2 flex items-center justify-between">

              <label className="text-sm font-medium">
                Job description
              </label>

              <span className="text-xs text-[#90939a]">
                {job.length} characters
              </span>

            </div>

            <textarea
              value={job}
              onChange={(e) =>
                setJob(
                  e.target.value
                )
              }
              placeholder="Paste the job title, requirements, responsibilities and company details here..."
              className="min-h-[360px] w-full resize-none rounded-xl border border-[#dedfe3] bg-white p-4 text-sm leading-6 outline-none transition focus:border-[#7467f0] focus:ring-4 focus:ring-[#7467f0]/10"
            />

            <div className="mt-5 rounded-xl bg-[#f7f7fa] p-4">

              <p className="text-sm font-medium">
                What we&apos;ll detect
              </p>

              <p className="mt-1 text-xs leading-5 text-[#74777f]">
                Role, company, required
                skills, missing skills,
                keywords and salary
                information when
                available.
              </p>

            </div>

          </section>

        </div>

        <div className="mt-6 flex flex-col items-center justify-between gap-4 rounded-2xl border border-[#e3e5e8] bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)] sm:flex-row">

          <div>
            <p className="text-sm font-semibold">
              Ready to tailor?
            </p>

            <p className="mt-1 text-xs text-[#777a82]">
              AI will only use experience
              already present in your
              resume.
            </p>
          </div>

          <button
            onClick={tailorResume}
            disabled={
              !ready ||
              loading
            }
            className="h-12 w-full min-w-[160px] rounded-xl bg-[#6254e8] px-7 text-sm font-semibold text-white transition hover:bg-[#5548d8] disabled:cursor-not-allowed disabled:bg-[#c7c7cc] sm:w-auto"
          >
            {loading
              ? "Tailoring..."
              : "Tailor Resume"}
          </button>

        </div>

        {loading && (
          <div className="mt-6 rounded-2xl border border-[#e3e5e8] bg-white p-8 text-center">

            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-[#e8e6ff] border-t-[#6254e8]" />

            <p className="mt-4 text-sm font-semibold">
              Tailoring your resume
            </p>

            <p className="mt-1 text-xs text-[#777a82]">
              Analyzing the job and
              matching your experience...
            </p>

          </div>
        )}

        {error && (
          <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-5">

            <p className="text-sm font-semibold text-red-700">
              Something went wrong
            </p>

            <p className="mt-1 text-sm text-red-600">
              {error}
            </p>

          </div>
        )}

        {result && (
          <section
            id="result"
            className="mt-10 scroll-mt-8"
          >

            <div className="mb-5">

              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#6254e8]">
                AI Analysis
              </p>

              <h2 className="mt-2 text-2xl font-semibold tracking-tight">
                Your tailored resume
              </h2>

              <p className="mt-2 text-sm text-[#74777f]">
                Review the analysis and
                edit your resume before
                downloading it.
              </p>

            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

              <InfoCard
                label="Role"
                value={
                  result.role ||
                  "Not detected"
                }
              />

              <InfoCard
                label="Company"
                value={
                  result.company ||
                  "Not detected"
                }
              />

              <InfoCard
                label="Salary"
                value={
                  result.salary ||
                  "Not provided"
                }
              />

              <div className="rounded-2xl border border-[#e3e5e8] bg-white p-5">

                <p className="text-xs text-[#858890]">
                  Match score
                </p>

                <div className="mt-2 flex items-end gap-1">

                  <span className="text-3xl font-semibold text-[#6254e8]">
                    {result.matchScore}
                  </span>

                  <span className="mb-1 text-sm text-[#777a82]">
                    %
                  </span>

                </div>

              </div>

            </div>

            <div className="mt-4 grid gap-4 lg:grid-cols-2">

              <div className="rounded-2xl border border-[#e3e5e8] bg-white p-5">

                <p className="text-sm font-semibold">
                  Matched skills
                </p>

                <p className="mt-1 text-xs text-[#858890]">
                  Skills supported by
                  your resume that match
                  this job.
                </p>

                <div className="mt-4 flex flex-wrap gap-2">

                  {result.matchedSkills
                    ?.length > 0 ? (
                    result.matchedSkills.map(
                      (skill) => (
                        <span
                          key={skill}
                          className="rounded-full bg-green-50 px-3 py-1.5 text-xs font-medium text-green-700"
                        >
                          {skill}
                        </span>
                      )
                    )
                  ) : (
                    <span className="text-sm text-[#858890]">
                      No matching skills
                      detected.
                    </span>
                  )}

                </div>

              </div>

              <div className="rounded-2xl border border-[#e3e5e8] bg-white p-5">

                <p className="text-sm font-semibold">
                  Missing skills
                </p>

                <p className="mt-1 text-xs text-[#858890]">
                  Job requirements not
                  found in your current
                  resume.
                </p>

                <div className="mt-4 flex flex-wrap gap-2">

                  {result.missingSkills
                    ?.length > 0 ? (
                    result.missingSkills.map(
                      (skill) => (
                        <span
                          key={skill}
                          className="rounded-full bg-orange-50 px-3 py-1.5 text-xs font-medium text-orange-700"
                        >
                          {skill}
                        </span>
                      )
                    )
                  ) : (
                    <span className="text-sm text-[#858890]">
                      No major missing
                      skills detected.
                    </span>
                  )}

                </div>

              </div>

            </div>

            <div className="mt-4 overflow-hidden rounded-2xl border border-[#e3e5e8] bg-white">

              <div className="flex flex-col justify-between gap-3 border-b border-[#ececef] px-5 py-4 sm:flex-row sm:items-center">

                <div>
                  <h3 className="text-sm font-semibold">
                    Tailored resume
                  </h3>

                  <p className="mt-1 text-xs text-[#858890]">
                    You can manually edit
                    the AI generated
                    version below.
                  </p>
                </div>

                <span className="text-xs text-[#92949a]">
                  {result.tailoredResume
                    ?.length || 0}{" "}
                  characters
                </span>

              </div>

              <textarea
                value={
                  result.tailoredResume
                }
                onChange={(e) =>
                  setResult({
                    ...result,
                    tailoredResume:
                      e.target.value,
                  })
                }
                className="min-h-[600px] w-full resize-y bg-white p-6 text-sm leading-7 outline-none"
              />

            </div>

            <div className="mt-4 flex flex-col gap-4 rounded-2xl border border-[#e3e5e8] bg-white p-5 sm:flex-row sm:items-center sm:justify-between">

              <div>
                <p className="text-sm font-semibold">
                  Your resume is ready
                </p>

                <p className="mt-1 text-xs leading-5 text-[#777a82]">
                  Review your changes,
                  then download the
                  tailored resume as a
                  PDF.
                </p>
              </div>

              <button
                onClick={downloadPDF}
                disabled={
                  pdfLoading ||
                  !result.tailoredResume.trim()
                }
                className="h-11 shrink-0 rounded-xl bg-[#6254e8] px-6 text-sm font-semibold text-white transition hover:bg-[#5548d8] disabled:cursor-not-allowed disabled:bg-[#c7c7cc]"
              >
                {pdfLoading
                  ? "Creating PDF..."
                  : "Download PDF"}
              </button>

            </div>

            <div className="mt-4 rounded-2xl border border-[#e3e5e8] bg-white p-5 md:p-6">

              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#6254e8]">
                    Cover Letter
                  </p>

                  <h3 className="mt-2 text-lg font-semibold">
                    Create a matching
                    cover letter
                  </h3>

                  <p className="mt-1 text-sm text-[#777a82]">
                    Generate a cover
                    letter based on your
                    tailored resume and
                    this job.
                  </p>
                </div>

                <button
                  onClick={
                    generateCoverLetter
                  }
                  disabled={
                    coverLoading
                  }
                  className="h-11 shrink-0 rounded-xl bg-[#16181d] px-6 text-sm font-semibold text-white transition hover:bg-black disabled:cursor-not-allowed disabled:bg-[#a5a5aa]"
                >
                  {coverLoading
                    ? "Generating..."
                    : coverLetter
                      ? "Generate Again"
                      : "Generate Cover Letter"}
                </button>

              </div>

              {coverError && (
                <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4">
                  <p className="text-sm text-red-600">
                    {coverError}
                  </p>
                </div>
              )}

              {coverLoading && (
                <div className="mt-5 flex items-center gap-3 rounded-xl bg-[#f7f7fa] p-4">

                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#ddd9ff] border-t-[#6254e8]" />

                  <div>
                    <p className="text-sm font-medium">
                      Writing your cover
                      letter
                    </p>

                    <p className="mt-1 text-xs text-[#777a82]">
                      Matching your
                      experience with
                      this role...
                    </p>
                  </div>

                </div>
              )}

              {coverLetter &&
                !coverLoading && (
                  <div className="mt-5 overflow-hidden rounded-xl border border-[#e3e5e8]">

                    <div className="flex items-center justify-between border-b border-[#ececef] bg-[#fafafa] px-4 py-3">

                      <p className="text-sm font-medium">
                        Generated cover
                        letter
                      </p>

                      <span className="text-xs text-[#92949a]">
                        {coverLetter.length}{" "}
                        characters
                      </span>

                    </div>

                    <textarea
                      value={coverLetter}
                      onChange={(e) =>
                        setCoverLetter(
                          e.target.value
                        )
                      }
                      className="min-h-[420px] w-full resize-y bg-white p-5 text-sm leading-7 outline-none"
                    />

                    <div className="flex justify-end border-t border-[#ececef] p-4">

                      <button
                        type="button"
                        onClick={() =>
                          navigator.clipboard.writeText(
                            coverLetter
                          )
                        }
                        className="h-10 rounded-xl border border-[#dedfe3] bg-white px-5 text-sm font-medium transition hover:bg-[#f7f7fa]"
                      >
                        Copy Cover Letter
                      </button>

                    </div>

                  </div>
                )}

            </div>

            <div className="mt-4 rounded-2xl border border-[#e3e5e8] bg-white p-5 md:p-6">

              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#6254e8]">
                    Interview Prep
                  </p>

                  <h3 className="mt-2 text-lg font-semibold">
                    Prepare for your
                    interview
                  </h3>

                  <p className="mt-1 text-sm text-[#777a82]">
                    Get likely interview
                    questions based on
                    your resume and
                    target job.
                  </p>
                </div>

                <button
                  onClick={
                    generateInterviewPrep
                  }
                  disabled={
                    interviewLoading
                  }
                  className="h-11 shrink-0 rounded-xl bg-[#16181d] px-6 text-sm font-semibold text-white transition hover:bg-black disabled:cursor-not-allowed disabled:bg-[#a5a5aa]"
                >
                  {interviewLoading
                    ? "Preparing..."
                    : interviewQuestions.length >
                        0
                      ? "Generate Again"
                      : "Generate Interview Prep"}
                </button>

              </div>

              {interviewError && (
                <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4">

                  <p className="text-sm text-red-600">
                    {interviewError}
                  </p>

                </div>
              )}

              {interviewLoading && (
                <div className="mt-5 flex items-center gap-3 rounded-xl bg-[#f7f7fa] p-4">

                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#ddd9ff] border-t-[#6254e8]" />

                  <div>
                    <p className="text-sm font-medium">
                      Preparing your
                      interview
                    </p>

                    <p className="mt-1 text-xs text-[#777a82]">
                      Finding likely
                      questions for this
                      role...
                    </p>
                  </div>

                </div>
              )}

              {interviewQuestions.length >
                0 &&
                !interviewLoading && (
                  <div className="mt-6 space-y-3">

                    {interviewQuestions.map(
                      (
                        item,
                        index
                      ) => (
                        <details
                          key={index}
                          className="group overflow-hidden rounded-xl border border-[#e3e5e8] bg-white"
                        >

                          <summary className="flex cursor-pointer list-none items-start justify-between gap-4 p-5">

                            <div className="flex gap-4">

                              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#f0efff] text-xs font-semibold text-[#6254e8]">
                                {index +
                                  1}
                              </div>

                              <div>
                                <span className="mb-2 inline-block rounded-full bg-[#f7f7fa] px-2.5 py-1 text-[11px] font-medium text-[#777a82]">
                                  {
                                    item.type
                                  }
                                </span>

                                <p className="text-sm font-semibold leading-6">
                                  {
                                    item.question
                                  }
                                </p>
                              </div>

                            </div>

                            <span className="text-xl text-[#858890] transition group-open:rotate-45">
                              +
                            </span>

                          </summary>

                          <div className="border-t border-[#ececef] bg-[#fafafa] px-5 py-5 sm:pl-[68px]">

                            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#6254e8]">
                              Suggested
                              Answer
                            </p>

                            <p className="mt-3 whitespace-pre-line text-sm leading-7 text-[#555860]">
                              {
                                item.answer
                              }
                            </p>

                            <button
                              type="button"
                              onClick={() =>
                                navigator.clipboard.writeText(
                                  item.answer
                                )
                              }
                              className="mt-4 rounded-lg border border-[#dedfe3] bg-white px-3 py-2 text-xs font-medium transition hover:bg-[#f7f7fa]"
                            >
                              Copy Answer
                            </button>

                          </div>

                        </details>
                      )
                    )}

                  </div>
                )}

            </div>

          </section>
        )}

        <p className="mt-8 text-center text-xs text-[#92949a]">
          Your resume is not saved to a
          database.
        </p>

      </div>
    </main>
  );
}

function InfoCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-[#e3e5e8] bg-white p-5">

      <p className="text-xs text-[#858890]">
        {label}
      </p>

      <p className="mt-2 font-semibold">
        {value}
      </p>

    </div>
  );
}