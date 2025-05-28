/* eslint-disable prettier/prettier */
import React, { useState, useEffect } from "react";
import { getConcerts } from "../../../services/concert.service";
import { getAttendanceForConcert } from "../../../services/repetition.service";
import { eliminateChoriste } from "../../../services/accounts.service"; // ✅ clean service
import { Button, Form, Table, Spinner } from "react-bootstrap";
import Select from "react-select";
import Swal from "sweetalert2";

const ManageEliminations = () => {
  const [concerts, setConcerts] = useState([]);
  const [selectedConcert, setSelectedConcert] = useState(null);
  const [choristes, setChoristes] = useState([]);
  const [selectedChoristes, setSelectedChoristes] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchConcerts();
  }, []);

  const fetchConcerts = async () => {
    try {
      const res = await getConcerts();
      setConcerts(res);
    } catch (err) {
      console.error("Erreur chargement concerts:", err);
    }
  };

  const fetchAttendance = async (concertId) => {
    setLoading(true);
    try {
      const res = await getAttendanceForConcert(concertId);
      setChoristes(res);
    } catch (err) {
      console.error("Erreur chargement participations:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleEliminateSelected = async () => {
    if (selectedChoristes.length === 0) {
      Swal.fire("Erreur", "Veuillez sélectionner au moins un choriste.", "error");
      return;
    }

    const { isConfirmed } = await Swal.fire({
      title: "Confirmer élimination",
      text: `Vous êtes sur le point d’éliminer ${selectedChoristes.length} choriste(s).`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Oui, éliminer",
      cancelButtonText: "Annuler",
    });

    if (!isConfirmed) return;

    try {
      for (const choristeId of selectedChoristes) {
        await eliminateChoriste(choristeId); // ✅ use service
      }

      Swal.fire("Succès", "Choriste(s) éliminé(s) avec succès.", "success");

      // Refresh the list
      fetchAttendance(selectedConcert.value);
      setSelectedChoristes([]);
    } catch (err) {
      console.error("Erreur élimination:", err);
      Swal.fire("Erreur", "Échec lors de l’élimination.", "error");
    }
  };

  return (
    <div className="p-4">
      <h3 className="mb-4">Gestion des Éliminations</h3>

      <Form.Group className="mb-3" style={{ maxWidth: "400px" }}>
        <Form.Label>Choisir un concert</Form.Label>
        <Select
          options={concerts.map((c) => ({
            label: `${c.location} – ${new Date(c.dateHeure).toLocaleDateString("fr-FR")}`,
            value: c._id,
          }))}
          value={selectedConcert}
          onChange={(opt) => {
            setSelectedConcert(opt);
            if (opt) fetchAttendance(opt.value);
            setChoristes([]);
            setSelectedChoristes([]);
          }}
          placeholder="Sélectionner un concert..."
          isClearable
        />
      </Form.Group>

      {loading ? (
        <div className="text-center py-5">
          <Spinner animation="border" />
        </div>
      ) : selectedConcert && choristes.length > 0 ? (
        <>
          <Table bordered hover responsive>
            <thead>
              <tr>
                <th></th>
                <th>Nom Complet</th>
                <th>Email</th>
                <th>Présence %</th>
              </tr>
            </thead>
            <tbody>
              {choristes.map((c) => (
                <tr key={c.choristeId}>
                  <td>
                    <Form.Check
                      type="checkbox"
                      checked={selectedChoristes.includes(c.choristeId)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedChoristes([...selectedChoristes, c.choristeId]);
                        } else {
                          setSelectedChoristes(
                            selectedChoristes.filter((id) => id !== c.choristeId)
                          );
                        }
                      }}
                    />
                  </td>
                  <td>{c.firstName} {c.lastName}</td>
                  <td>{c.email}</td>
                  <td>{c.attendanceRate}%</td>
                </tr>
              ))}
            </tbody>
          </Table>

          <Button variant="danger" onClick={handleEliminateSelected}>
            Éliminer les sélectionnés
          </Button>
        </>
      ) : selectedConcert ? (
        <p>Aucun choriste trouvé pour ce concert.</p>
      ) : (
        <p>Sélectionnez un concert pour commencer.</p>
      )}
    </div>
  );
};

export default ManageEliminations;
