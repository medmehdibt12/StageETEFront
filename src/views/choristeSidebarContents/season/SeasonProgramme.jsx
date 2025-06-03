/* eslint-disable prettier/prettier */
import React, { useEffect, useState } from "react";
import { getConcerts } from "../../../services/concert.service";
import { getOeuvreById } from "../../../services/oeuvre.service";
import { getRepetitionsByConcert } from "../../../services/repetition.service";
import { Spinner, Button } from "react-bootstrap";
import Select from "react-select";
import Swal from "sweetalert2";
import {
  FaCalendarAlt,
  FaMapMarkerAlt,
  FaMusic,
  FaClock,
  FaInfoCircle,
} from "react-icons/fa";

const SeasonProgramme = () => {
  const [concerts, setConcerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState({ value: 'upcoming', label: 'À venir' });

  const statusOptions = [
    { value: 'upcoming', label: 'À venir' },
    { value: 'past', label: 'Passé' }
  ];

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

  const filteredConcerts = concerts
    .filter((concert) => {
      const now = new Date();
      const concertDate = new Date(concert.dateHeure);
      const matchesStatus =
        (filterStatus.value === 'upcoming' && concertDate >= now) ||
        (filterStatus.value === 'past' && concertDate < now);
      const matchesSearch = concert.title.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesStatus && matchesSearch;
    })
    .sort((a, b) => new Date(a.dateHeure) - new Date(b.dateHeure));

  const formatFullDate = (iso) =>
    new Date(iso).toLocaleDateString("fr-FR", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });

  const formatTime = (iso) =>
    new Date(iso).toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
    });

  const formatConcertDateFR = (isoString) => {
    return new Date(isoString).toLocaleDateString("fr-FR", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
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
        }).join("");

      Swal.fire({
        html: `
        <style>
          .prog-modal-container { font-family: 'Segoe UI'; max-width: 820px; margin: auto; background: #f9fafb; border: 1px solid #e0e0e0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.08); }
          .prog-header { background: rgb(76, 89, 104); color: #fff; text-align: center; padding: 20px 0; }
          .prog-header h1 { margin: 0; font-size: 24px; color: #fff; }
          .prog-subheader { text-align: center; background: #fff; padding: 20px 0; border-bottom: 1px solid #e0e0e0; }
          .prog-subheader img { width: 100px; margin-bottom: 12px; }
          .prog-body { background: #fff; padding: 20px 30px; max-height: 380px; overflow-y: auto; }
          .prog-card { background: #fff; border-left: 4px solid #26394E; border-radius: 8px; padding: 16px; margin-bottom: 16px; box-shadow: 0 1px 4px rgba(0,0,0,0.05); }
          .prog-card-header { display: flex; align-items: center; font-weight: 600; font-size: 1rem; color: #2c2c2c; margin-bottom: 8px; }
          .prog-card-header span:first-child { margin-right: 8px; font-size: 20px; }
          .prog-card-body { margin-left: 28px; font-size: 0.9rem; color: #444; text-align: left; }
          .prog-footer { background: #f1f5f9; text-align: center; font-size: 14px; color: #5e5043; font-style: italic; padding: 20px 32px; }
          .swal2-programme-popup { background: transparent !important; box-shadow: none !important; }
          .swal2-programme-btn { background: rgb(76, 89, 104) !important; color: white !important; border-radius: 22px; padding: 8px 26px !important; font-size: 14px !important; }
        </style>
        <div class="prog-modal-container">
          <div class="prog-header"><h1>Orchestre Symphonique de Carthage</h1></div>
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
                ? repetitions.map((r) => {
                    if (!r.date || !r.startTime || !r.endTime) return "";
                    const dateObj = new Date(r.date);
                    const [startH, startM] = r.startTime.split(":");
                    const [endH, endM] = r.endTime.split(":");
                    const start = new Date(dateObj); start.setHours(+startH, +startM);
                    const end = new Date(dateObj); end.setHours(+endH, +endM);
                    const date = start.toLocaleDateString("fr-FR");
                    const startTime = start.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
                    const endTime = end.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
                    return `
                      <div class="prog-card" style="background:#fcfcfc;">
                        <div class="prog-card-header">📍 ${r.location || "Lieu inconnu"}</div>
                        <div class="prog-card-body">
                          <div><strong>Date :</strong> ${date}</div>
                          <div><strong>Heure :</strong> ${startTime} → ${endTime}</div>
                        </div>
                      </div>
                    `;
                  }).join("")
                : "<em style='color: gray;'>Aucune répétition prévue</em>"
            }
          </div>
          <div class="prog-footer">Orchestre Symphonique de Carthage</div>
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
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-center mb-4 gap-3">
        <input
          type="text"
          className="form-control"
          placeholder="Rechercher par nom"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ maxWidth: '280px' }}
        />
        <Select
          options={statusOptions}
          value={filterStatus}
          onChange={setFilterStatus}
          styles={{
            control: (base) => ({
              ...base,
              minWidth: 200,
              borderRadius: 12,
              boxShadow: 'none',
              borderColor: '#ced4da',
            }),
          }}
        />
      </div>

      {loading ? (
        <div className="text-center py-5">
          <Spinner animation="border" />
        </div>
      ) : filteredConcerts.length === 0 ? (
        <p className="text-center text-muted">Aucun concert trouvé.</p>
      ) : (
        <div className="agenda-list">
          {filteredConcerts.map((concert) => (
            <div
              key={concert._id}
              className="border rounded shadow-sm p-3 mb-4"
              style={{ background: '#ffffff' }}
            >
              <div className="mb-2 d-flex align-items-center" style={{ color: '#1d4ed8', fontWeight: '600' }}>
                <FaCalendarAlt className="me-2" size={18} />
                {formatFullDate(concert.dateHeure)}
              </div>

              <div className="mb-1" style={{ fontSize: '15px' }}>
                <FaMusic className="me-2" color="#6366f1" />
                <strong style={{ color: '#111827' }}>Titre :</strong> {concert.title}
              </div>

              <div className="mb-1" style={{ fontSize: '15px' }}>
                <FaMapMarkerAlt className="me-2" color="#10b981" />
                <strong style={{ color: '#111827' }}>Lieu :</strong> {concert.location}
              </div>

              <div className="mb-1" style={{ fontSize: '15px' }}>
                <FaClock className="me-2" color="#f59e0b" />
                <strong style={{ color: '#111827' }}>Heure :</strong> {formatTime(concert.dateHeure)}
              </div>

              {concert.affiche && (
                <div className="mt-1" style={{ fontSize: '15px' }}>
                  <strong>Affiche :</strong>{" "}
                  <a
                    href={`${import.meta.env.VITE_BACKEND_URL}/uploads/posters/${concert.affiche}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ textDecoration: "underline", color: "#3b82f6" }}
                  >
                    Voir
                  </a>
                </div>
              )}

              <div className="text-end mt-3">
              <Button
                  variant="outline-primary"
                  onClick={() => handleShowDetails(concert)}
                  style={{ borderRadius: '24px', padding: '6px 18px', fontSize: '14px', fontWeight: 500 }}
                >
                  <FaInfoCircle className="me-2" /> Voir détails
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SeasonProgramme;
