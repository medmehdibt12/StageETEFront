/* eslint-disable prettier/prettier */
import React, { useEffect, useState } from "react";
import { getConcerts } from "../../../services/concert.service";
import { getOeuvreById } from "../../../services/oeuvre.service";
import { getRepetitionsByConcert } from "../../../services/repetition.service";
import { Card, Row, Col, Spinner, Button } from "react-bootstrap";

import Swal from "sweetalert2";

const SeasonProgramme = () => {
  const [concerts, setConcerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const formatConcertDateFR = (isoString) => {
    return new Date(isoString).toLocaleDateString("fr-FR", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  useEffect(() => {
    fetchConcerts();
  }, []);

  const fetchConcerts = async () => {
    try {
      const data = await getConcerts();
      setConcerts(data);
    } catch (error) {
      console.error("Erreur lors du chargement des concerts:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleShowDetails = async (concert) => {
    try {
      const programmeDetails = await Promise.all(
        (concert.programme || []).map((item) =>
          getOeuvreById(typeof item === "string" ? item : item._id)
        )
      );

      const repetitions = await getRepetitionsByConcert(concert._id);
      const formattedDate = formatConcertDateFR(concert.dateHeure);

      // const allArrangers = Array.from(
      //   new Set(programmeDetails.flatMap((o) => o.arrangers || []))
      // );
      // const arrangersString = allArrangers.length ? allArrangers.join(", ") : "—";

      const piecesHtml = programmeDetails
        .map((o) => {
          const composers = o.composers?.join(", ") || "Aucun";
          const arrangers = o.arrangers?.length ? o.arrangers.join(", ") : "—";

          return `
      <div class="prog-card">
        <div class="prog-card-header">
          <span>🎺</span>
          <span>${o.title}</span>
        </div>
        <div class="prog-card-body">
          <div>
            <strong style="font-size:16px; font-style: italic;">
              Compositeurs:
            </strong> ${composers}
          </div>
          <div style="margin-top:4px;">
            <strong style="font-size:16px; font-style: italic;">
              Arrangeurs:
            </strong> ${arrangers}
          </div>
        </div>
      </div>
    `;
        })
        .join("");

      Swal.fire({
        html: `
        <style>
          .prog-modal-container {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            max-width: 820px;
            margin: auto;
            background: #f9fafb;
            border: 1px solid #e0e0e0;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 10px rgba(0,0,0,0.08);
          }
          .prog-header {
            position: relative;
            background:rgb(76, 89, 104);
            color: #fff;
            text-align: center;
            padding: 20px 0;
          }
          .prog-header h1 {
            display: inline-block;
            margin: 0;
            font-family: 'Trebuchet MS', sans-serif;
            font-size: 24px;
            letter-spacing: 1px;
            color: #fff;
          }
          .prog-subheader {
            text-align: center;
            background: #ffffff;
            padding: 20px 0;
            border-bottom: 1px solid #e0e0e0;
          }
          .prog-subheader img {
            width: 100px;
            height: auto;
            margin-bottom: 12px;
          }
          .prog-subheader p {
            margin: 0;
            font-size: 18px;
            color: #26394E;
            font-weight: 500;
          }
          .prog-body {
            background: #ffffff;
            padding: 20px 30px;
            max-height: 380px;
            overflow-y: auto;
          }
          .prog-card {
            background: #ffffff;
            border-left: 4px solid #26394E;
            border-radius: 8px;
            padding: 16px;
            margin-bottom: 16px;
            box-shadow: 0 1px 4px rgba(0,0,0,0.05);
            transition: box-shadow .2s;
          }
          .prog-card:hover {
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
          }
          .prog-card-header {
            display: flex;
            align-items: center;
            font-weight: 600;
            font-size: 1rem;
            color: #2c2c2c;
            margin-bottom: 8px;
          }
          .prog-card-header span:first-child {
            margin-right: 8px;
            font-size: 20px;
          }
          .prog-card-body {
            margin-left: 28px;
            font-size: 0.9rem;
            color: #444;
            text-align:left;
          }
          .prog-footer {
            background: #f1f5f9;
            text-align: center;
            font-size: 14px;
            color: #5e5043;
            font-style: italic;
            padding:20px 32px;
          }
          .prog-footer .arrangers-list {
            display: inline-block;
            margin-left: 6px;
            font-style: normal;
          }
          .swal2-programme-popup {
            background: transparent !important;
            box-shadow: none !important;
          }
          .swal2-programme-btn {
            background:rgb(76, 89, 104) !important;
            color: white !important;
            font-weight: 500;
            border-radius: 22px;
            padding: 8px 26px !important;
            font-size: 14px !important;
            box-shadow: 0 3px 10px rgba(0,0,0,0.08) !important;
          }
        </style>
  
        <div class="prog-modal-container">
          <div class="prog-header">
            <h1>Orchestre Symphonique de Carthage</h1>
          </div>
  
          <div class="prog-subheader">
            <img src="../../src/assets/images/music.png" alt="CSO Logo" />
            <p>Programme du ${formattedDate}</p>
          </div>
  
          <div class="prog-body">
            ${piecesHtml}
  
            <hr style="margin: 25px 0; border-color: #e5e7eb;" />
  
            <h4 style="margin-bottom: 12px; font-size: 17px;">📅 Répétitions liées</h4>
            ${
              repetitions.length
                ? repetitions
                    .map((r) => {
                      if (!r.date || !r.startTime || !r.endTime) return "";

                      const dateObj = new Date(r.date);
                      const [startH, startM] = r.startTime.split(":");
                      const [endH, endM] = r.endTime.split(":");

                      const start = new Date(dateObj);
                      start.setHours(+startH, +startM);

                      const end = new Date(dateObj);
                      end.setHours(+endH, +endM);

                      const date = start.toLocaleDateString("fr-FR");
                      const startTime = start.toLocaleTimeString("fr-FR", {
                        hour: "2-digit",
                        minute: "2-digit",
                      });
                      const endTime = end.toLocaleTimeString("fr-FR", {
                        hour: "2-digit",
                        minute: "2-digit",
                      });

                      return `
                      <div class="prog-card" style="background:#fcfcfc;">
                        <div class="prog-card-header">
                          📍 ${r.location || "Lieu inconnu"}
                        </div>
                        <div class="prog-card-body">
                          <div><strong>Date :</strong> ${date}</div>
                          <div><strong>Heure :</strong> ${startTime} → ${endTime}</div>
                        </div>
                      </div>
                    `;
                    })
                    .join("")
                : "<em style='color: gray;'>Aucune répétition prévue</em>"
            }
            
            
            
            
          </div>
  
          <div class="prog-footer">
  <span class="arrangers-list">Orchestre Symphonique de Carthage</span>
          </div>
        </div>
      `,
        customClass: {
          popup: "swal2-programme-popup",
          confirmButton: "swal2-programme-btn",
        },
        showConfirmButton: true,
        confirmButtonText: "Fermer",
        width: "660px",
        padding: 0,
        background: "transparent",
      });
    } catch (err) {
      console.error("Erreur lors de l’affichage des détails:", err);
      Swal.fire("Erreur", "Impossible d’afficher les détails.", "error");
    }
  };

  return (
    <div className="p-4">
      <div className="text-center mb-5">
        <h2 style={{ fontWeight: 600 }}>
          <span role="img" aria-label="calendar"></span> Programme de la saison
        </h2>
        <p style={{ color: "#6b7280" }}>
          Visualisez les concerts à venir et leurs détails.
        </p>
      </div>

      {loading ? (
        <div className="text-center py-5">
          <Spinner animation="border" />
        </div>
      ) : concerts.length === 0 ? (
        <p className="text-center text-muted">
          Aucun concert prévu pour cette saison.
        </p>
      ) : (
        <Row xs={1} md={2} lg={3} className="g-4">
          {concerts.map((concert) => (
            <Col key={concert._id}>
              <Card
                className="h-100 shadow-sm border-0"
                style={{
                  borderRadius: "16px",
                  background: "linear-gradient(to right, #f9fafb, #ffffff)",
                }}
              >
                <Card.Body className="d-flex flex-column justify-content-between">
                  <div>
                    <Card.Title
                      style={{ fontWeight: "bold", fontSize: "20px" }}
                    >
                      {concert.title}
                    </Card.Title>
                    <Card.Text style={{ fontSize: "15px", color: "#4b5563" }}>
                      <strong>📍 Lieu :</strong> {concert.location}
                      <br />
                      <strong>📅 Date :</strong>{" "}
                      {new Date(concert.dateHeure).toLocaleDateString("fr-FR")}
                      <br />
                      <strong>🕓 Heure :</strong>{" "}
                      {new Date(concert.dateHeure).toLocaleTimeString("fr-FR", {
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
                  </div>
                  <div className="text-end mt-3">
                    <Button
                      variant="outline-primary"
                      onClick={() => handleShowDetails(concert)}
                      style={{
                        borderRadius: "24px",
                        padding: "6px 18px",
                        fontSize: "14px",
                        fontWeight: 500,
                      }}
                    >
                      Voir détails
                    </Button>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      )}
    </div>
  );
};

export default SeasonProgramme;
