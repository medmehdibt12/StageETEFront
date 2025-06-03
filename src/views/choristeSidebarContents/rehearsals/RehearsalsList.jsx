/* eslint-disable prettier/prettier */
import React, { useEffect, useState } from "react";
import {
  getRepetitions,
  markRepetitionPresence,
  markRepetitionAbsence,
} from "../../../services/repetition.service";
import {
  Card,
  Row,
  Col,
  Button,
  Spinner,
  Form,
  InputGroup,
} from "react-bootstrap";
import { CheckCircle, XCircle } from "lucide-react";
import Swal from "sweetalert2";
import Select from "react-select";
import { useAuth } from "../../../contexts/AuthContext";

const TIME_FILTER_OPTIONS = [
  { value: "upcoming", label: "À venir" },
  { value: "past", label: "Passées" },
  { value: "all", label: "Tous" },
];

const RehearsalsList = () => {
  const { user } = useAuth();

  // État pour le filtre “À venir / Passées / Tous” et pour la recherche par lieu
  const [timeFilter, setTimeFilter] = useState(TIME_FILTER_OPTIONS[0]);
  const [locationTerm, setLocationTerm] = useState("");
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
      inputPlaceholder: "Saisissez le motif ici…",
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

  const isPastEnd = (dateStr, endTimeStr) => {
    const [endH, endM] = endTimeStr.split(":").map(Number);
    const endDate = new Date(dateStr);
    endDate.setHours(endH, endM, 0, 0);
    return endDate.getTime() <= Date.now();
  };

  const hasPassed75Percent = (dateStr, startTimeStr, endTimeStr) => {
    const [startH, startM] = startTimeStr.split(":").map(Number);
    const [endH, endM] = endTimeStr.split(":").map(Number);

    const startDate = new Date(dateStr);
    startDate.setHours(startH, startM, 0, 0);

    const endDate = new Date(dateStr);
    endDate.setHours(endH, endM, 0, 0);

    const durationMs = endDate.getTime() - startDate.getTime();
    const thresholdMs = startDate.getTime() + durationMs * 0.75;

    return Date.now() >= thresholdMs;
  };

  // 1) Filtrer par “À venir / Passées / Tous” en utilisant isPastEnd
  const filteredByTime = repetitions.filter((rep) => {
    const isPast = isPastEnd(rep.date, rep.endTime);
    if (timeFilter.value === "upcoming") return !isPast;
    if (timeFilter.value === "past") return isPast;
    return true; // “Tous”
  });

  // 2) Filtrer par lieu (case-insensitive)
  const filteredRepetitions = filteredByTime.filter((rep) =>
    rep.location.toLowerCase().includes(locationTerm.toLowerCase())
  );

  // 3) Pagination sur filteredRepetitions
  const indexOfLast = currentPage * repetitionsPerPage;
  const indexOfFirst = indexOfLast - repetitionsPerPage;
  const currentRepetitions = filteredRepetitions.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(filteredRepetitions.length / repetitionsPerPage);

  return (
    <div className="p-4">
      {/* Filtre "À venir / Passées / Tous" avec React-Select */}
      <div style={{ maxWidth: 240, marginBottom: "1rem" }}>
        <Select
          options={TIME_FILTER_OPTIONS}
          value={timeFilter}
          onChange={(opt) => {
            setTimeFilter(opt);
            setCurrentPage(1);
          }}
          isSearchable={false}
          placeholder="Afficher : "
          styles={{
            control: (provided) => ({
              ...provided,
              minHeight: "32px",
              fontSize: "0.9rem",
            }),
            singleValue: (provided) => ({
              ...provided,
              marginLeft: 8,
            }),
            menu: (provided) => ({
              ...provided,
              fontSize: "0.9rem",
            }),
          }}
        />
      </div>

      {/* Champ de recherche par lieu */}
      <Form.Group className="mb-4" style={{ maxWidth: 400 }}>
        <InputGroup>
          <Form.Control
            type="text"
            placeholder="Rechercher par lieu…"
            value={locationTerm}
            onChange={(e) => {
              setLocationTerm(e.target.value);
              setCurrentPage(1);
            }}
          />
        </InputGroup>
      </Form.Group>

      {loading ? (
        <div className="text-center py-5">
          <Spinner animation="border" />
        </div>
      ) : filteredRepetitions.length === 0 ? (
        <p className="text-muted text-center">
          Aucune répétition correspondant aux critères.
        </p>
      ) : (
        <>
          <Row xs={1} md={2} lg={3} className="g-4">
            {currentRepetitions.map((rep) => {
              const repDateStr = rep.date;
              const repStartTime = rep.startTime;
              const repEndTime = rep.endTime;

              const beyond75 = hasPassed75Percent(repDateStr, repStartTime, repEndTime);
              // const pastEnd = isPastEnd(repDateStr, repEndTime);

              const markedPresent = rep.presentChoristes?.includes(user?._id);
              const markedAbsent = rep.absentChoristes?.some(
                (a) => a.choriste === user?._id
              );
              const isMarking = markingIds.includes(rep._id);

              let actionButtons = null;

              // 1) Si l’utilisateur est en congé, on bloque tout
              if (user?.status === "En congé") {
                actionButtons = (
                  <Button
                    variant="secondary"
                    disabled
                    size="sm"
                    style={{ borderRadius: 20, opacity: 0.6 }}
                  >
                    En congé
                  </Button>
                );

              // 2) Si l’action est en cours, on ne montre rien
              } else if (isMarking) {
                actionButtons = null;

              // 3) Déjà marqué “Absent”
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

              // 4) Déjà marqué “Présent”
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
                    <CheckCircle size={16} /> Présent
                  </Button>
                );

              // 5) Avant 75 % de la durée : “Je suis présent” reste actif
              } else if (!beyond75) {
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
                    {/* “Je suis absent” toujours actif */}
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

              // 6) À partir de 75 % de la durée (ou après la fin), on désactive “Je suis présent”
              } else {
                actionButtons = (
                  <div className="d-flex gap-2">
                    {/* “Je suis présent” désactivé */}
                    <Button
                      variant="outline-secondary"
                      disabled
                      size="sm"
                      style={{ borderRadius: 20, opacity: 0.6 }}
                    >
                      Je suis présent
                    </Button>
                    {/* “Je suis absent” reste actif, même après 75 % */}
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
                  <Card className="shadow-sm border-0" style={{ borderRadius: 16 }}>
                    <Card.Body>
                      <Card.Title style={{ fontWeight: 600 }}>
                        📍 {rep.location}
                      </Card.Title>
                      <Card.Text>
                        <strong>Date :</strong>{" "}
                        {new Date(repDateStr).toLocaleDateString("fr-FR")}
                        <br />
                        <strong>Heure :</strong> {repStartTime} → {repEndTime}
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
                <li className={`page-item ${currentPage === 1 ? "disabled" : ""}`}>
                  <button className="page-link" onClick={() => setCurrentPage(1)}>
                    ⏮
                  </button>
                </li>
                <li className={`page-item ${currentPage === 1 ? "disabled" : ""}`}>
                  <button
                    className="page-link"
                    onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
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
                        <li className={`page-item ${currentPage === n ? "active" : ""}`}>
                          <button className="page-link" onClick={() => setCurrentPage(n)}>
                            {n}
                          </button>
                        </li>
                      </React.Fragment>
                    );
                  })}

                <li className={`page-item ${currentPage === totalPages ? "disabled" : ""}`}>
                  <button
                    className="page-link"
                    onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                  >
                    ▶
                  </button>
                </li>
                <li className={`page-item ${currentPage === totalPages ? "disabled" : ""}`}>
                  <button className="page-link" onClick={() => setCurrentPage(totalPages)}>
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
