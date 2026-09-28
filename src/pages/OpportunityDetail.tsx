import { useState } from "react";
import { useParams } from "react-router-dom";
import { Screen } from "../components/Screen";
import { Icon } from "../components/Icon";
import {
  Button,
  Skeleton,
  useFirstVisitLoading,
} from "../components/primitives";
import { HeaderShare, SaveButton } from "../components/shared";
import { useAppStore, type ApplicationKind } from "../state";
import { useAppNavigation } from "../navigation";
import {
  demoDays,
  getOpportunity,
  type Opportunity,
} from "../data/opportunities";
import {
  ApplicationRail,
  DemoDayCard,
  openApplication,
  OpportunityTile,
  requestApplicationAnswer,
} from "./Opportunities";
import "./opportunities.css";

const honda = {
  amountSuffix: "per startup",
  promise: "To co-develop your product with Honda",
  tags: ["No equity", "No fee"],
  facts: [
    ["Apply by", "Fri 2 Oct"],
    ["Cohort", "Mid Oct"],
    ["Build", "Oct – Jan"],
  ],
  issuer: "Run by Honda",
  issuerSub: "With T-Hub · Hyderabad",
  benefits: [
    ["Build with Honda", "Engineers, test riders and customer feedback"],
    ["Grow with T-Hub", "Mentors and investor intros"],
    ["A possible pilot", "If the proof of concept works"],
  ],
  aboutTitle: "About this challenge",
  about:
    "Build digital tools that make everyday two- and four-wheeler travel safer and simpler. Selected startups co-develop with Honda from October to January.",
  needs: [
    ["A working product, ready to integrate", ""],
    ["A team that can deliver a proof of concept", ""],
    ["Scalable, workable economics", ""],
    ["Traction helps, but isn't required", ""],
  ],
  timeline: [
    ["Fri 2 Oct", "Apply by"],
    ["Mid Oct", "Cohort picked"],
    ["Oct – Jan", "Build the PoC"],
    ["Jan 2027", "Demo day"],
  ],
  officialTitle: "Full brief and terms",
  officialLabel: "On the official programme page · t-hub.co",
  ctaNote: "You'll apply on T-Hub's website",
};
const kotak = {
  amountSuffix: "grant support",
  promise: "For selected startups in the accelerator",
  tags: ["No equity", "No fee"],
  facts: [
    ["Apply by", "Tue 6 Oct"],
    ["Shortlist", "Mid Oct"],
    ["Duration", "6–8 months"],
  ],
  issuer: "Run by Kotak Mahindra Bank",
  issuerSub: "BizLabs accelerator",
  benefits: [
    ["Expert guidance", "Mentors, bootcamps and workshops"],
    ["Market access", "Investors and Kotak's network"],
    ["Grant support", "Decided after the programme review"],
  ],
  aboutTitle: "About this programme",
  about: "A 6–8 month accelerator for market-ready startups with revenue.",
  needs: [
    ["DPIIT recognition", ""],
    ["A market-ready product", ""],
    ["Customers and revenue", ""],
    ["A focus on one of the listed sectors", ""],
  ],
  timeline: [
    ["Tue 6 Oct", "Apply by"],
    ["Mid Oct", "Pitch"],
    ["Nov – May", "Accelerator"],
    ["May 2027", "Demo day"],
  ],
  officialTitle: "Full brief and terms",
  officialLabel: "On the official programme page · kotak.com/bizlabs",
  ctaNote: "You'll apply on Kotak BizLabs",
};
const performance = {
  amountSuffix: "",
  promise: "5% of last year’s turnover, paid back to you",
  tags: ["No equity", "Not a loan"],
  facts: [
    ["Claim by", "Thu 31 Dec"],
    ["For", "FY 2025-26"],
    ["You apply", "Directly"],
  ],
  issuer: "Run by Govt of Telangana",
  issuerSub: "Startup Telangana · Hyderabad",
  benefits: [
    ["5% of your turnover back", "Capped at ₹10 lakh"],
    ["Keep all your equity", "A reimbursement, not an investment"],
    ["No incubator needed", "You claim it from the state yourself"],
  ],
  aboutTitle: "About this grant",
  about:
    "Telangana pays recognised startups 5% of their turnover for the year, up to ₹10 lakh. Claims are due within nine months of the year closing, so FY 2025-26 claims close on 31 December.",
  needs: [
    ["Registered in Telangana", "Kisanly is in Hyderabad"],
    ["State startup recognition", "Telangana's certificate, not DPIIT"],
    ["Turnover in FY 2025-26", "The grant is 5% of it"],
  ],
  timeline: [
    ["1", "Get your state recognition"],
    ["2", "Have last year's accounts ready"],
    ["3", "Claim on the state portal"],
  ],
  officialTitle: "Scheme details and terms",
  officialLabel: "On the official page · startup.telangana.gov.in",
  ctaNote: "You’ll apply on startup.telangana.gov.in",
};
type Detail = typeof honda;
// P0-17: every catalogue entry uses one of the complete approved templates.
// The card's identity, funding, deadline and chips remain the source of truth.
function completeDetail(item: Opportunity): Detail {
  const throughHub =
    item.id === "kotak-bizlabs" || item.tags.includes("Through T-Hub");
  const base = throughHub
    ? kotak
    : item.kind === "grants"
      ? performance
      : honda;
  const issuer = item.issuer || item.subtitle;
  const sourceIssuer = throughHub
    ? /Kotak Mahindra Bank|Kotak/g
    : item.kind === "grants"
      ? /Govt of Telangana|Telangana/g
      : /Honda/g;
  const replaceIssuer = (value: string) => value.replace(sourceIssuer, issuer);
  const replaceCopy = (value: string) =>
    replaceIssuer(value)
      .replaceAll(
        throughHub
          ? "₹30 lakh"
          : item.kind === "grants"
            ? "₹10 lakh"
            : "₹40 lakh",
        item.amount || "",
      )
      .replaceAll(
        throughHub
          ? "Tue 6 Oct"
          : item.kind === "grants"
            ? "Thu 31 Dec"
            : "Fri 2 Oct",
        item.date,
      );
  return {
    ...base,
    promise: replaceCopy(base.promise),
    issuer: `Run by ${issuer}`,
    issuerSub: item.subtitle,
    facts: [[item.dateLabel || "Apply", item.date], ...base.facts.slice(1)],
    benefits: base.benefits.map(([title, description]) => [
      replaceCopy(title),
      replaceCopy(description),
    ]),
    about: replaceCopy(base.about),
    timeline: base.timeline.map(([date, event], index) => [
      item.kind === "challenges" && index === 0 ? item.date : date,
      event,
    ]),
    officialLabel: `On the official programme page · ${new URL(item.officialUrl).hostname.replace(/^www\./, "")}`,
    ctaNote: `You’ll continue on ${new URL(item.officialUrl).hostname.replace(/^www\./, "")}`,
  };
}

export function OpportunityDetailPage({ kind }: { kind: ApplicationKind }) {
  const { id } = useParams();
  const item = getOpportunity(kind, id);
  const state = useAppStore();
  const [expanded, setExpanded] = useState(false);
  const loading = useFirstVisitLoading(`${kind}:${item.id}`);
  const application = state.applications.find(
    (a) => a.kind === kind && a.itemId === item.id,
  );
  const isKotak =
    item.id === "kotak-bizlabs" || item.tags.includes("Through T-Hub");
  const isHonda = kind === "challenges" && !isKotak;
  const isPerformance = kind === "grants" && !isKotak;
  const detail = completeDetail(item);
  const grantEligibility = kind === "grants";
  const needs =
    isKotak && kind === "grants"
      ? [
          [
            "A listed sector",
            `${state.profile.startupName} is ${state.profile.sector.toLowerCase()}`,
          ],
          ["DPIIT recognition", "We don't have this on file"],
          ["Customers and revenue", "A market-ready product"],
        ]
      : detail.needs;
  const closed =
    item.status === "Closed" ||
    item.status === "Opening soon" ||
    item.status === "Opens later";
  const cta = application
    ? kind === "grants"
      ? "Open official page"
      : "Open programme page"
    : closed
      ? "Open official page"
      : "Apply now";
  const openPage = () =>
    application
      ? window.open(item.officialUrl, "_blank", "noopener,noreferrer")
      : openApplication(item);
  return (
    <Screen
      variant="detail"
      title={item.title}
      className="opportunity-detail"
      right={
        <>
          <HeaderShare title={item.title} />
          <SaveButton kind={kind} id={item.id} />
        </>
      }
      action={
        <>
          <div className="opportunity-detail-cta">
            {!application && <SaveButton kind={kind} id={item.id} />}
            <Button onClick={openPage}>
              {cta}
              <span aria-hidden="true"> ↗</span>
            </Button>
          </div>
          <p className="opportunity-action-note">
            {application
              ? kind === "grants"
                ? "Check the official portal for your claim status"
                : "Check the programme page for updates"
              : detail.ctaNote}
          </p>
        </>
      }
    >
      <div className="content-body opportunity-detail-body">
        {loading ? (
          <>
            <Skeleton style={{ width: 64, height: 72, borderRadius: 12 }} />
            <Skeleton style={{ width: "85%", height: 28 }} />
            <Skeleton style={{ height: 246, borderRadius: 18 }} />
            <Skeleton style={{ height: 240, borderRadius: 18 }} />
          </>
        ) : (
          <>
            {application && (
              <div className="application-saved-banner">
                <Icon name="check" size={20} />
                <div className="grow">
                  <strong>Marked as applied</strong>
                  <small>
                    Marked Fri 25 Sep · shows in{" "}
                    {kind === "grants" ? "Applied" : "Saved"}
                  </small>
                </div>
                <button onClick={() => requestApplicationAnswer(item)}>
                  Edit
                </button>
              </div>
            )}
            <div className="opportunity-detail-hero">
              <OpportunityTile item={item} />
              <div className="opportunity-detail-title">
                {kind === "grants" && <p>{item.subtitle}</p>}
                <h1 data-detail-title>{item.title}</h1>
                <div className="opportunity-status-chips">
                  <span>
                    {application
                      ? kind === "grants"
                        ? "Marked as applied"
                        : "Applied · your update"
                      : item.status === "Open"
                        ? item.closesIn
                          ? `Open · ${item.closesIn} days left`
                          : "Open"
                        : item.status}
                  </span>
                  {!application &&
                    item.tags.map((tag) => <span key={tag}>{tag}</span>)}
                </div>
              </div>
            </div>
            {kind === "challenges" && item.status === "Closed" && (
              <div className="closed-opportunity-demo">
                <p>
                  Applications are closed. You can still watch the finalists.
                </p>
                <DemoDayCard
                  event={
                    item.id === "feg-hackathon"
                      ? demoDays[1]
                      : item.id === "maruti-mobility"
                        ? demoDays[0]
                        : {
                            ...demoDays[0],
                            id: `${item.id}-demo`,
                            title: `${item.title} demo day`,
                            subtitle: `Finalists pitch live to ${item.issuer}`,
                            issuer: item.issuer || item.subtitle,
                            logo: item.image || demoDays[0].logo,
                          }
                  }
                />
              </div>
            )}
            <section className="opportunity-value-card">
              <div className="opportunity-value-main">
                <span className="opportunity-value-kicker">
                  {item.amountLabel === "Refund of SGST paid"
                    ? "REFUND OF SGST PAID"
                    : "UP TO"}
                </span>
                <div>
                  <strong>{item.amount}</strong>
                  {detail.amountSuffix && <span>{detail.amountSuffix}</span>}
                </div>
                <p>{detail.promise}</p>
                <div className="chip-row">
                  {detail.tags.map((tag) => (
                    <span className="chip" key={tag}>
                      <Icon name="check" size={12} />
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
              <div className="opportunity-value-facts">
                {detail.facts.map(([title, value]) => (
                  <div key={title}>
                    <small>{title}</small>
                    <strong>{value}</strong>
                  </div>
                ))}
              </div>
            </section>
            <div className="opportunity-issuer">
              <OpportunityTile item={item} small />
              <div>
                <strong>{detail.issuer}</strong>
                <small>{detail.issuerSub}</small>
              </div>
            </div>
            {!!detail.benefits.length && (
              <section className="opportunity-benefits">
                {detail.benefits.map(([title, description], index) => (
                  <div key={title}>
                    <span className="opportunity-benefit-icon">
                      <Icon
                        name={
                          index === 0
                            ? "briefcase"
                            : index === 1
                              ? "profile"
                              : "grant"
                        }
                        size={18}
                      />
                    </span>
                    <div>
                      <strong>{title}</strong>
                      <small>{description}</small>
                    </div>
                  </div>
                ))}
              </section>
            )}
            <section className="opportunity-about">
              <h2>{detail.aboutTitle}</h2>
              <p>{detail.about}</p>
              {(isHonda || isPerformance) && (
                <>
                  <button
                    className="text-button"
                    aria-expanded={expanded}
                    onClick={() => setExpanded(!expanded)}
                  >
                    {expanded ? "Show less" : "Show more"}{" "}
                    <Icon name="chevron" size={12} />
                  </button>
                  {expanded && (
                    <p>
                      {isHonda
                        ? `Engineers, test riders and customer feedback. A possible pilot with ${item.issuer}, if the proof of concept works.`
                        : "A reimbursement, not an investment. You claim it from the state yourself."}
                    </p>
                  )}
                </>
              )}
            </section>
            {isHonda && (
              <section>
                <div className="opportunity-group-heading">
                  <h2>What {item.issuer} wants</h2>
                  <span>Pick one or both</span>
                </div>
                <div className="honda-focus-cards">
                  <div>
                    <svg
                      width="26"
                      height="26"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      aria-hidden="true"
                    >
                      <path d="M12 3 5 6v5c0 4.5 3 8.3 7 10 4-1.7 7-5.5 7-10V6z" />
                      <path d="m9 12 2 2 4-4" />
                    </svg>
                    <strong>Mobility for women</strong>
                    <small>
                      Safety, emergency help, self-service maintenance
                    </small>
                  </div>
                  <div>
                    <svg
                      width="26"
                      height="26"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      aria-hidden="true"
                    >
                      <circle cx="6.5" cy="16.5" r="3" />
                      <circle cx="17.5" cy="16.5" r="3" />
                      <path d="M6.5 16.5 10 9h5l2.5 7.5M9 6h3" />
                    </svg>
                    <strong>Everyday mobility</strong>
                    <small>Simpler trips, ownership and service</small>
                  </div>
                </div>
              </section>
            )}
            {isKotak && (
              <section>
                <div className="opportunity-group-heading">
                  <h2>Sectors {item.issuer} backs</h2>
                  <span>14 sectors</span>
                </div>
                <div className="chip-row sector-chips">
                  {item.focus?.map((sector) => (
                    <span
                      className={`chip ${sector === state.profile.sector ? "selected" : ""}`}
                      key={sector}
                    >
                      {sector}
                    </span>
                  ))}
                </div>
                <small className="opportunity-subcopy">
                  Your sector is highlighted. One application covers all.
                </small>
              </section>
            )}
            {!!needs.length && (
              <section>
                <div className="opportunity-group-heading">
                  <h2>
                    {grantEligibility ? "Who can apply" : "What you'll need"}
                  </h2>
                  {grantEligibility && <span>1 of 3 on your profile</span>}
                </div>
                <div
                  className={`opportunity-needs ${grantEligibility ? "eligibility-list" : ""}`}
                >
                  {needs.map(([title, description], index) => (
                    <div
                      className={
                        grantEligibility ? "eligibility-row" : "requirement-row"
                      }
                      key={title}
                    >
                      <Icon
                        name={
                          grantEligibility && index > 0 ? "profile" : "check"
                        }
                        size={17}
                      />
                      <div className="grow">
                        <strong>{title}</strong>
                        {description && (
                          <small>
                            {isPerformance && index === 0
                              ? `${state.profile.startupName} is in ${state.profile.city}`
                              : description}
                          </small>
                        )}
                      </div>
                      {grantEligibility && (
                        <span
                          className={index === 0 ? "profile-match" : "to-check"}
                        >
                          {index === 0 ? "On your profile" : "To check"}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}
            {!!detail.timeline.length && (
              <section>
                <h2>{isPerformance ? "How to claim" : "Timeline"}</h2>
                <div
                  className={`opportunity-timeline ${isPerformance ? "claim-steps" : ""}`}
                >
                  {detail.timeline.map(([date, event], index) => (
                    <div key={date}>
                      <span>{date}</span>
                      <div>
                        <strong>{event}</strong>
                        {isPerformance && (
                          <small>
                            {
                              [
                                "Skip this if you already have it",
                                "They show your FY 2025-26 turnover",
                                application
                                  ? "Marked Fri 25 Sep"
                                  : `By ${item.date}`,
                              ][index]
                            }
                          </small>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}
            {application && (
              <section>
                <h2>Your application</h2>
                <p className="opportunity-subcopy">
                  Only you see this. Update it when you hear back.
                </p>
                <ApplicationRail item={item} />
              </section>
            )}
            <a
              className="opportunity-official"
              href={item.officialUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              <div>
                <strong>{detail.officialTitle}</strong>
                <small>{detail.officialLabel}</small>
              </div>
              <span aria-hidden="true">↗</span>
            </a>
            {kind === "grants" && (isPerformance || isKotak) && (
              <small className="opportunity-checked">
                Last checked by T-Hub on Thu 24 Sep
              </small>
            )}
          </>
        )}
      </div>
    </Screen>
  );
}

export function ApplicationSavedPage({ kind }: { kind: ApplicationKind }) {
  const { id } = useParams();
  const item = getOpportunity(kind, id);
  const nav = useAppNavigation();
  return (
    <Screen
      title="Application saved"
      className="application-outcome"
      action={
        <div className="application-outcome-actions">
          <Button onClick={() => nav.switchTab("home")}>Done</Button>
          <Button
            variant="secondary"
            onClick={() => nav.go(`/${kind}/${item.id}`, { replace: true })}
          >
            View application
          </Button>
        </div>
      }
    >
      <div className="content-body application-outcome-body">
        <div className="application-outcome-check">
          <Icon name="check" size={32} />
        </div>
        <h2>Marked as applied</h2>
        <p>Your application is saved. Update it when you hear back.</p>
        <div className="application-outcome-item">
          <OpportunityTile item={item} />
          <div>
            <strong>{item.title}</strong>
            <small>{item.issuer}</small>
          </div>
        </div>
        <ApplicationRail item={item} />
      </div>
    </Screen>
  );
}
