/* eslint-disable prettier/prettier */
import React, { useEffect, useState } from "react";
import {
  getConcerts,
  markConcertAvailability,
  getConcertAttendanceEligibility,
} from "../../../services/concert.service";
import { Card, Row, Col, Button, Spinner } from "react-bootstrap";
import Swal from "sweetalert2";
import { useAuth } from "../../../contexts/AuthContext";
import { CheckCircle, XCircle } from "lucide-react";

const ConcertsAvailability = () => {
  const { user } = useAuth();
  const [concerts, setConcerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [markingIds, setMarkingIds] = useState([]);
  const [eligibilityMap, setEligibilityMap] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const concertsPerPage = 9;

  useEffect(() => {
    fetchConcerts();
  }, []);

  const fetchConcerts = async () => {
    try {
      const data = await getConcerts();
      setConcerts(data);

      const updatedMap = {};
      for (const concert of data) {
        try {
          const res = await getConcertAttendanceEligibility(
            concert._id,
            user._id
          );
          updatedMap[concert._id] = res.eligible;
        } catch {
          updatedMap[concert._id] = false;
        }
      }
      setEligibilityMap(updatedMap);
    } catch (err) {
      console.error("Erreur chargement concerts :", err);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAvailable = async (id) => {
    setMarkingIds((prev) => [...prev, id]);
    try {
      await markConcertAvailability(id);
      Swal.fire({
        toast: true,
        position: "top-end",
        icon: "success",
        title: "Disponibilité enregistrée",
        showConfirmButton: false,
        timer: 3000,
      });
      await fetchConcerts();
    } catch (err) {
      Swal.fire("Erreur", err?.response?.data?.message || "Échec", "error");
    } finally {
      setMarkingIds((prev) => prev.filter((x) => x !== id));
    }
  };

  // Pagination logic
  const indexOfLast = currentPage * concertsPerPage;
  const indexOfFirst = indexOfLast - concertsPerPage;
  const currentConcerts = concerts.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(concerts.length / concertsPerPage);

  return (
    <div className="p-4">
      <div className="text-center mb-5">
        <h2 style={{ fontWeight: 600 }}>Disponibilité aux Concerts</h2>
        <p className="text-muted">
          Indiquez à quels concerts vous pouvez participer.
        </p>
      </div>

      {loading ? (
        <div className="text-center py-5">
          <Spinner animation="border" />
        </div>
      ) : concerts.length === 0 ? (
        <p className="text-muted text-center">Aucun concert prévu.</p>
      ) : (
        <>
          <Row xs={1} md={2} lg={3} className="g-4">
            {currentConcerts.map((concert) => {
              const isAvailable = concert.availableChoristes?.includes(
                user._id
              );
              const isMarking = markingIds.includes(concert._id);
              const concertDate = new Date(concert.dateHeure);
              const isFuture = concertDate > new Date();
              const isEligible = eligibilityMap[concert._id];

              return (
                <Col key={concert._id}>
                  <Card
                    className="shadow-sm border-0"
                    style={{ borderRadius: 16 }}
                  >
                    <Card.Body>
                      <Card.Title style={{ fontWeight: 600 }}>
                      {concert.title}
                      </Card.Title>
                      <Card.Text>
                        <strong>📍 Lieu :</strong>{" "}
                        {concert.location}
                        <br />
                        <strong>📅 Date :</strong>{" "}
                        {concertDate.toLocaleDateString("fr-FR")}
                        <br />
                        <strong>🕓 Heure :</strong>{" "}
                        {concertDate.toLocaleTimeString("fr-FR", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                        {concert.affiche && (
                          <>
                            <br />
                            <strong>Affiche :</strong>{" "}
                            <a
                              href={`${import.meta.env.VITE_BACKEND_URL}/uploads/posters/${concert.affiche}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{
                                textDecoration: "underline",
                                color: "#3b82f6",
                              }}
                            >
                              Voir
                            </a>
                          </>
                        )}
                      </Card.Text>

                      <div className="d-flex justify-content-end">
                        {isAvailable ? (
                          <Button
                            variant="success"
                            disabled
                            size="sm"
                            style={{ borderRadius: 20 }}
                          >
                            <CheckCircle size={16} /> Disponible
                          </Button>
                        ) : isFuture ? (
                          isEligible ? (
                            <Button
                              variant="outline-primary"
                              size="sm"
                              onClick={() => handleMarkAvailable(concert._id)}
                              disabled={isMarking}
                              style={{
                                borderRadius: 20,
                                fontWeight: 500,
                              }}
                            >
                              Je suis disponible
                            </Button>
                          ) : (
                            <Button
                              variant="danger"
                              disabled
                              size="sm"
                              style={{ borderRadius: 20 }}
                            >
                              <XCircle size={16} /> Taux de présence insuffisant
                            </Button>
                          )
                        ) : (
                          <Button
                            variant="secondary"
                            disabled
                            size="sm"
                            style={{ borderRadius: 20, opacity: 0.6 }}
                          >
                            Concert passé
                          </Button>
                        )}
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              );
            })}
          </Row>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="d-flex justify-content-center mt-4">
              <ul className="pagination">
                <li
                  className={`page-item ${currentPage === 1 ? "disabled" : ""}`}
                >
                  <button
                    className="page-link"
                    onClick={() => setCurrentPage(1)}
                  >
                    ⏮
                  </button>
                </li>
                <li
                  className={`page-item ${currentPage === 1 ? "disabled" : ""}`}
                >
                  <button
                    className="page-link"
                    onClick={() => setCurrentPage(currentPage - 1)}
                  >
                    ◀
                  </button>
                </li>
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(
                    (n) =>
                      Math.abs(currentPage - n) <= 2 ||
                      n === 1 ||
                      n === totalPages
                  )
                  .map((n, i, arr) => {
                    const prev = arr[i - 1];
                    return (
                      <React.Fragment key={n}>
                        {prev && n - prev > 1 && (
                          <li className="page-item disabled">
                            <span className="page-link">…</span>
                          </li>
                        )}
                        <li
                          className={`page-item ${currentPage === n ? "active" : ""}`}
                        >
                          <button
                            className="page-link"
                            onClick={() => setCurrentPage(n)}
                          >
                            {n}
                          </button>
                        </li>
                      </React.Fragment>
                    );
                  })}
                <li
                  className={`page-item ${currentPage === totalPages ? "disabled" : ""}`}
                >
                  <button
                    className="page-link"
                    onClick={() => setCurrentPage(currentPage + 1)}
                  >
                    ▶
                  </button>
                </li>
                <li
                  className={`page-item ${currentPage === totalPages ? "disabled" : ""}`}
                >
                  <button
                    className="page-link"
                    onClick={() => setCurrentPage(totalPages)}
                  >
                    ⏭
                  </button>
                </li>
              </ul>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ConcertsAvailability;
