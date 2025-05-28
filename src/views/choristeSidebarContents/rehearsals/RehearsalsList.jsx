/* eslint-disable prettier/prettier */
import React, { useEffect, useState } from "react";
import {
  getRepetitions,
  markRepetitionPresence,
  markRepetitionAbsence,
} from "../../../services/repetition.service";
import { Card, Row, Col, Button, Spinner } from "react-bootstrap";
import { CheckCircle, XCircle } from "lucide-react";
import Swal from "sweetalert2";
import { useAuth } from "../../../contexts/AuthContext";

const RehearsalsList = () => {
  const { user } = useAuth();
  const [repetitions, setRepetitions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [markingIds, setMarkingIds] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const repetitionsPerPage = 9;

  useEffect(() => {
    fetchRepetitions();
  }, []);

  const fetchRepetitions = async () => {
    try {
      const data = await getRepetitions();
      setRepetitions(data);
    } catch (error) {
      console.error("Erreur lors du chargement des répétitions :", error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkPresence = async (id) => {
    setMarkingIds((prev) => [...prev, id]);

    try {
      await markRepetitionPresence(id);
      Swal.fire({
        toast: true,
        position: "top-end",
        icon: "success",
        title: "Présence enregistrée",
        showConfirmButton: false,
        timer: 3000,
      });
      await fetchRepetitions();
    } catch (err) {
      const msg = err?.response?.data?.message;
      Swal.fire({
        icon: "error",
        title: "Erreur",
        text: msg || "Impossible d'enregistrer la présence.",
      });
    } finally {
      setMarkingIds((prev) => prev.filter((x) => x !== id));
    }
  };

  const handleMarkAbsence = async (id) => {
    const { value: reason } = await Swal.fire({
      title: "Motif d’absence",
      input: "textarea",
      inputLabel: "Pourquoi êtes-vous absent(e) ?",
      inputPlaceholder: "Saisissez le motif ici...",
      showCancelButton: true,
      confirmButtonText: "Valider",
      cancelButtonText: "Annuler",
      inputValidator: (value) => {
        if (!value || value.trim() === "") {
          return "Le motif est requis.";
        }
        return null;
      },
    });

    if (!reason) return;

    setMarkingIds((prev) => [...prev, id]);

    try {
      await markRepetitionAbsence(id, reason);
      Swal.fire({
        toast: true,
        position: "top-end",
        icon: "success",
        title: "Absence enregistrée",
        showConfirmButton: false,
        timer: 3000,
      });
      await fetchRepetitions();
    } catch (err) {
      Swal.fire("Erreur", err?.response?.data?.message || "Échec", "error");
    } finally {
      setMarkingIds((prev) => prev.filter((x) => x !== id));
    }
  };

  const isPast = (dateStr, timeStr) => {
    const [hours, minutes] = timeStr.split(":").map(Number);
    const date = new Date(dateStr);
    date.setHours(hours, minutes, 0, 0);
    return date <= new Date();
  };

  // Pagination logic
  const indexOfLast = currentPage * repetitionsPerPage;
  const indexOfFirst = indexOfLast - repetitionsPerPage;
  const currentRepetitions = repetitions.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(repetitions.length / repetitionsPerPage);

  return (
    <div className="p-4">
      <div className="text-center mb-5">
        <h2 style={{ fontWeight: 600 }}>
          <span role="img" aria-label="calendar">
          </span>{" "}
          Liste des Répétitions
        </h2>
        <p className="text-muted">
          Consultez les répétitions planifiées et indiquez votre présence ou
          absence.
        </p>
      </div>

      {loading ? (
        <div className="text-center py-5">
          <Spinner animation="border" />
        </div>
      ) : repetitions.length === 0 ? (
        <p className="text-muted text-center">Aucune répétition planifiée.</p>
      ) : (
        <>
          <Row xs={1} md={2} lg={3} className="g-4">
            {currentRepetitions.map((rep) => {
              const isAfter = isPast(rep.date, rep.endTime);
              const markedPresent = rep.presentChoristes?.includes(user?._id);
              const markedAbsent = rep.absentChoristes?.some(
                (a) => a.choriste === user?._id
              );
              const isMarking = markingIds.includes(rep._id);

              let actionButtons = null;

              if (isMarking) {
                actionButtons = null;
              } else if (markedAbsent) {
                actionButtons = (
                  <Button
                    variant="danger"
                    disabled
                    size="sm"
                    style={{ borderRadius: 20 }}
                  >
                        <XCircle size={16} /> Absent
                  </Button>
                );
              } else if (markedPresent) {
                actionButtons = (
                  <Button
                    variant="success"
                    disabled
                    size="sm"
                    style={{
                      borderRadius: 20,
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      fontWeight: 500,
                      padding: "6px 18px",
                    }}
                  >
                    <CheckCircle size={16} /> Validated
                  </Button>
                );
              } else if (isAfter) {
                actionButtons = (
                  <div className="d-flex gap-2">
                    <Button
                      variant="outline-primary"
                      size="sm"
                      onClick={() => handleMarkPresence(rep._id)}
                      style={{ borderRadius: 20, fontWeight: 500 }}
                    >
                      Je suis présent
                    </Button>
                    <Button
                      variant="outline-danger"
                      size="sm"
                      onClick={() => handleMarkAbsence(rep._id)}
                      style={{ borderRadius: 20, fontWeight: 500 }}
                    >
                      Je suis absent
                    </Button>
                  </div>
                );
              } else {
                actionButtons = (
                  <div className="d-flex gap-2">
                    <Button
                      variant="outline-secondary"
                      disabled
                      size="sm"
                      style={{ borderRadius: 20, opacity: 0.6 }}
                    >
                      Je suis présent
                    </Button>
                    <Button
                      variant="outline-danger"
                      size="sm"
                      onClick={() => handleMarkAbsence(rep._id)}
                      style={{ borderRadius: 20, fontWeight: 500 }}
                    >
                      Je suis absent
                    </Button>
                  </div>
                );
              }

              return (
                <Col key={rep._id}>
                  <Card
                    className="shadow-sm border-0"
                    style={{ borderRadius: 16 }}
                  >
                    <Card.Body>
                      <Card.Title style={{ fontWeight: 600 }}>
                        📍 {rep.location}
                      </Card.Title>
                      <Card.Text>
                        <strong>Date :</strong>{" "}
                        {new Date(rep.date).toLocaleDateString("fr-FR")}
                        <br />
                        <strong>Heure :</strong> {rep.startTime} → {rep.endTime}
                      </Card.Text>

                      <div className="d-flex justify-content-end mt-3">
                        {actionButtons}
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              );
            })}
          </Row>

          {/* Pagination controls */}
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
                            <span className="page-link">...</span>
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

export default RehearsalsList;
