import { useParams } from "react-router-dom";
import { Screen } from "../components/Screen";
import { HeaderShare, SaveButton } from "../components/shared";
import {
  Button,
  FadeImage,
  Skeleton,
  useFirstVisitLoading,
} from "../components/primitives";
import { Icon } from "../components/Icon";
import {
  mentorById,
  mentorCompany,
  mentorFirstName,
  mentorLinkedIn,
  mentorProfileCopy,
  mentors,
} from "../data/mentors";
import { sessionAllowance } from "../data/bookingRules";
import { useAppNavigation } from "../navigation";
import { useAppStore } from "../state";
import { MentorRow } from "./Mentors";
import "./mentor-profile.css";

export function MentorDetailPage() {
  const { id } = useParams();
  const mentor = mentorById(id);
  const firstName = mentorFirstName(mentor);
  const { go } = useAppNavigation();
  const state = useAppStore();
  const loading = useFirstVisitLoading(`/mentors/${mentor.id}`);
  const priorities = state.setup.answers.priorities.join(" ").toLowerCase();
  const recommendations = mentors
    .filter((item) => item.id !== mentor.id)
    .slice(0, 2);
  const topics = [
    {
      title: "Pricing",
      matches: /pric/.test(priorities),
      icon: <span>₹</span>,
    },
    {
      title: "Go-to-market",
      matches: /go.to.market|finding customers/.test(priorities),
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
          <path
            d="M4 18l6-6 4 4 6-8"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ),
    },
    {
      title: "Validation",
      matches: /validat/.test(priorities),
      icon: <Icon name="check" size={16} />,
    },
  ];
  return (
    <Screen
      variant="detail"
      title={mentor.title}
      className="mentor-detail-page"
      right={
        <>
          <HeaderShare title={mentor.title} />
          <SaveButton kind="mentors" id={mentor.id} />
        </>
      }
      action={
        <div className="mentor-final-action">
          <div className="mentor-final-allowance">
            <span>
              <Icon name="sessions" size={14} />
              Next free <b>{mentor.date}</b>
            </span>
            <span>{sessionAllowance(state)} of 10 sessions left</span>
          </div>
          <Button onClick={() => go(`/mentors/${mentor.id}/book`)}>
            Book a session
          </Button>
        </div>
      }
    >
      <div className="mentor-final-content">
        {loading ? (
          <div
            className="mentor-final-skeleton"
            aria-label="Loading mentor profile"
          >
            <Skeleton style={{ height: 340, borderRadius: 22 }} />
            <Skeleton style={{ height: 70, borderRadius: 16 }} />
            <Skeleton style={{ height: 120, borderRadius: 16 }} />
          </div>
        ) : (
          <>
            <section className="mentor-final-identity">
              <div className="mentor-cover">
                <FadeImage
                  className="mentor-cover__photo"
                  src={`${import.meta.env.BASE_URL}${mentor.image}`}
                  alt={mentor.title}
                  style={{
                    objectPosition:
                      mentor.id === "mohit-arora"
                        ? "50% 18%"
                        : mentor.imagePosition,
                  }}
                  loading="eager"
                />
                <div className="mentor-cover__gradient" />
                <div className="mentor-cover__copy">
                  <div className="mentor-cover__name">
                    <h1 data-detail-title>{mentor.title}</h1>
                    <a
                      className="mentor-cover__linkedin"
                      href={mentorLinkedIn(mentor)}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`${mentor.title} on LinkedIn`}
                    >
                      <span>in</span>LinkedIn
                    </a>
                  </div>
                  <p>{mentor.subtitle}</p>
                </div>
              </div>
              <dl className="mentor-stat-strip">
                <div>
                  <dt>Based in</dt>
                  <dd>Hyderabad</dd>
                </div>
                <div>
                  <dt>Sectors</dt>
                  <dd>All sectors</dd>
                </div>
                <div>
                  <dt>Next free</dt>
                  <dd>{mentor.date}</dd>
                </div>
              </dl>
              <div className="mentor-final-fit">
                <h2>
                  <Icon name="sparkle" size={13} />
                  Why {firstName} fits {state.profile.startupName}
                </h2>
                <p>{mentorProfileCopy.why(firstName)}</p>
              </div>
            </section>
            <section className="mentor-final-section">
              <h2>Ask {firstName} about</h2>
              <div className="mentor-topics">
                {topics.map((topic) => (
                  <div className="mentor-topic" key={topic.title}>
                    <div className="mentor-topic__icon">{topic.icon}</div>
                    <span className="mentor-topic__name">{topic.title}</span>
                    {topic.matches && (
                      <span className="mentor-topic__match">
                        <Icon name="sparkle" size={10} />
                        You need this
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </section>
            <section className="mentor-final-section">
              <h2>In {firstName}'s words</h2>
              <blockquote className="mentor-quote">
                <span aria-hidden="true">“</span>
                <p>{mentorProfileCopy.quote}</p>
              </blockquote>
            </section>
            <section className="mentor-final-section">
              <h2>Background</h2>
              <dl className="mentor-final-background">
                <div>
                  <dt>Company</dt>
                  <dd>{mentorCompany(mentor)}</dd>
                </div>
                <div>
                  <dt>Worked with</dt>
                  <dd>{mentorProfileCopy.workedWith}</dd>
                </div>
              </dl>
            </section>
            <section className="mentor-final-section mentor-related">
              <div className="mentor-related__heading">
                <h2>Also good for pricing</h2>
                <button className="text-button" onClick={() => go("/mentors")}>
                  See all
                </button>
              </div>
              <div className="mentor-list">
                {recommendations.map((item) => (
                  <MentorRow key={item.id} item={item} />
                ))}
              </div>
            </section>
          </>
        )}
      </div>
    </Screen>
  );
}
