/* eslint-disable prettier/prettier */
import React, { useEffect, useState } from "react";
import {
  getConcerts,
  markConcertAvailability,
  getConcertAttendanceEligibility,
} from "../../../services/concert.service";
import {
  Card,
  Row,
  Col,
  Button,
  Spinner,
  Form,
  InputGroup,
} from "react-bootstrap";
import Swal from "sweetalert2";
import Select from "react-select";
import { useAuth } from "../../../contexts/AuthContext";
import { CheckCircle, XCircle } from "lucide-react";

const TIME_FILTER_OPTIONS = [
  { value: "upcoming", label: "À venir" },
  { value: "past", label: "Passés" },
  { value: "all", label: "Tous" },
];

const ConcertsAvailability = () => {
  const { user } = useAuth();

  // --------- Nouveaux états pour la recherche et le filtre "À venir / Passés / Tous" ---------
  const [searchTerm, setSearchTerm] = useState("");
  // Par défaut sur "À venir"
  const [selectedTimeFilter, setSelectedTimeFilter] = useState(
    TIME_FILTER_OPTIONS[0]
  );

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

      // Construire la map d'éligibilité pour chaque concert
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

  // Filtrer par date (À venir / Passés / Tous)
  const now = new Date();
  const byTimeFilter = (concert) => {
    const concertDate = new Date(concert.dateHeure);
    if (selectedTimeFilter.value === "upcoming") {
      return concertDate > now;
    } else if (selectedTimeFilter.value === "past") {
      return concertDate <= now;
    }
    return true; // "all"
  };

  // Filtrer par terme de recherche (titre de concert)
  const bySearchTerm = (concert) =>
    concert.title.toLowerCase().includes(searchTerm.toLowerCase());

  // Appliquer les deux filtres
  const filteredConcerts = concerts.filter(
    (c) => byTimeFilter(c) && bySearchTerm(c)
  );

  // Pagination
  const indexOfLast = currentPage * concertsPerPage;
  const indexOfFirst = indexOfLast - concertsPerPage;
  const currentConcerts = filteredConcerts.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(filteredConcerts.length / concertsPerPage);

  return (
    <div className="p-4">
      {/* 1) Filtre "À venir / Passés / Tous" en React-Select */}
      <div style={{ maxWidth: 240, marginBottom: "1rem" }}>
        <Select
          options={TIME_FILTER_OPTIONS}
          value={selectedTimeFilter}
          onChange={(opt) => {
            setSelectedTimeFilter(opt);
            setCurrentPage(1);
          }}
          isSearchable={false}
          placeholder="Afficher : "
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

      {/* 2) Zone de recherche */}
      <Form.Group className="mb-4" style={{ maxWidth: 400 }}>
        <InputGroup>
          <Form.Control
            type="text"
            placeholder="Rechercher par titre de concert..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1); // revenir à la première page si on change la recherche
            }}
          />
        </InputGroup>
      </Form.Group>

      {loading ? (
        <div className="text-center py-5">
          <Spinner animation="border" />
        </div>
      ) : filteredConcerts.length === 0 ? (
        <p className="text-muted text-center">Aucun concert correspondant.</p>
      ) : (
        <>
          <Row xs={1} md={2} lg={3} className="g-4">
            {currentConcerts.map((concert) => {
              const isAvailable = concert.availableChoristes?.includes(
                user._id
              );
              const isMarking = markingIds.includes(concert._id);
              const concertDate = new Date(concert.dateHeure);
              const isFuture = concertDate > now;
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
                        <strong>📍 Lieu :</strong> {concert.location}
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
                        ) : user.status === "En congé" ? (
                          <Button
                            variant="secondary"
                            disabled
                            size="sm"
                            style={{ borderRadius: 20, opacity: 0.6 }}
                          >
                            En congé
                          </Button>
                        ) : isFuture ? (
                          isEligible ? (
                            <Button
                              variant="outline-primary"
                              size="sm"
                              onClick={() =>
                                handleMarkAvailable(concert._id)
                              }
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
                              <XCircle size={16} /> Taux de présence
                              insuffisant
                            </Button>
                          )
                        ) : (
                          <Button
                            variant="secondary"
                            disabled
                          size="sm"
                           style={{ borderRadius: 20, opacity: 0.6 }}
                          >
                            Non disponible
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
                  className={`page-item ${
                    currentPage === 1 ? "disabled" : ""
                  }`}
                >
                  <button
                    className="page-link"
                    onClick={() => setCurrentPage(1)}
                  >
                    ⏮
                  </button>
                </li>
                <li
                  className={`page-item ${
                    currentPage === 1 ? "disabled" : ""
                  }`}
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
                          className={`page-item ${
                            currentPage === n ? "active" : ""
                          }`}
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
                  className={`page-item ${
                    currentPage === totalPages ? "disabled" : ""
                  }`}
                >
                  <button
                    className="page-link"
                    onClick={() => setCurrentPage(currentPage + 1)}
                  >
                    ▶
                  </button>
                </li>
                <li
                  className={`page-item ${
                    currentPage === totalPages ? "disabled" : ""
                  }`}
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
