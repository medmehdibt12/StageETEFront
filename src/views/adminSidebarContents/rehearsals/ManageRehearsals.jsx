/* eslint-disable jsx-a11y/click-events-have-key-events */
/* eslint-disable jsx-a11y/no-noninteractive-element-interactions */
/* eslint-disable prettier/prettier */
import React, { useEffect, useState } from "react";
import {
  getRepetitions,
  createRepetition,
  updateRepetition,
  // deleteRepetitionPermanent,
} from "../../../services/repetition.service";
import { getConcerts } from "../../../services/concert.service";
import { Button, Form, Modal, Table, Row, Col, Spinner } from "react-bootstrap";
import { Formik } from "formik";
import * as Yup from "yup";
import Select from "react-select";
import Swal from "sweetalert2";

const ITEMS_PER_PAGE = 5;
const pupitreOptions = ["soprano", "alto", "ténor", "basse"].map((p) => ({
  value: p,
  label: p.charAt(0).toUpperCase() + p.slice(1),
}));

// Fixed “Lieu” choices:
const lieuOptions = [
  { value: "Boulevard des arts", label: "Boulevard des arts" },
  { value: "AMI Assurances",      label: "AMI Assurances"    },
];

const ManageRehearsals = () => {
  const [repetitions, setRepetitions] = useState([]);
  const [concerts, setConcerts] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(false);

  const now = new Date();
  const pad = (n) => String(n).padStart(2, "0");

  // local YYYY-MM-DD
  const todayString = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(
    now.getDate()
  )}`;

  // local HH:MM
  const nowHM = `${pad(now.getHours())}:${pad(now.getMinutes())}`;

  const formatDateTime = (isoString) => {
    const d = new Date(isoString);
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [activeList, concertsList] = await Promise.all([
        getRepetitions(),
        getConcerts(),
      ]);
      setRepetitions(activeList);
      setConcerts(concertsList);
    } catch (err) {
      console.error("Erreur de chargement", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const filtered = repetitions.filter((r) =>
    r.location.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const pageCount = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated = filtered.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  return (
    <div className="p-4">
      <div className="d-flex justify-content-between mb-3">
        <Form.Control
          placeholder="Rechercher par lieu"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ maxWidth: "300px" }}
        />
        <Button
          variant="success"
          onClick={() => {
            setEditing(null);
            setShowModal(true);
          }}
        >
          + Ajouter une répétition
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-5">
          <Spinner animation="border" />
        </div>
      ) : (
        <>
          <Table bordered hover responsive>
            <thead>
              <tr>
                <th>#</th>
                <th>Date</th>
                <th>Heure</th>
                <th>Lieu</th>
                <th>Pupitres</th>
                <th>Concert lié</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginated.map((rep, idx) => (
                <tr key={rep._id}>
                  <td>{(currentPage - 1) * ITEMS_PER_PAGE + idx + 1}</td>
                  <td>{formatDateTime(rep.date)}</td>
                  <td>
                    {rep.startTime} → {rep.endTime}
                  </td>
                  <td>{rep.location}</td>
                  <td>
                    {Array.isArray(rep.pupitres) &&
                    rep.pupitres.length === 4 &&
                    ["soprano", "alto", "ténor", "basse"].every((p) =>
                      rep.pupitres.includes(p)
                    )
                      ? "Tout le chœur"
                      : rep.pupitres.join(", ")}
                  </td>
                  <td>{rep.concert?.title || "-"}</td>

                  <td>
                    <Button
                      size="sm"
                      variant="warning"
                      className="me-2"
                      onClick={() => {
                        setEditing(rep);
                        setShowModal(true);
                      }}
                    >
                      Modifier
                    </Button>
                    {/* <Button
                      size="sm"
                      variant="danger"
                      onClick={() => handlePermanentDelete(rep._id)}
                    >
                      Supprimer
                    </Button> */}
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>

          {pageCount > 1 && (
            <div className="d-flex justify-content-center mt-3 gap-1 flex-wrap">
              {Array.from({ length: pageCount }, (_, i) => (
                <Button
                  key={i}
                  size="sm"
                  variant={
                    i + 1 === currentPage ? "primary" : "outline-secondary"
                  }
                  onClick={() => setCurrentPage(i + 1)}
                >
                  {i + 1}
                </Button>
              ))}
            </div>
          )}
        </>
      )}

      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            {editing ? "Modifier une répétition" : "Ajouter une répétition"}
          </Modal.Title>
        </Modal.Header>

        <Formik
          enableReinitialize
          initialValues={{
            date: editing?.date?.substring(0, 10) || todayString,
            startTime: editing?.startTime || nowHM,
            endTime:
              editing?.endTime ||
              (() => {
                const d = new Date();
                d.setHours(d.getHours() + 2);
                return d.toTimeString().slice(0, 5);
              })(),
            // store “location” as a simple string
            location: editing?.location || "",
            // store “concert” as the concert._id string, or "" if none
            concert: editing?.concert?._id || "",
            pupitres: editing?.pupitres || [],
          }}
          validationSchema={Yup.object({
            date: Yup.string().required("La date est requise"),
            startTime: Yup.string().required("Heure de début requise"),
            endTime: Yup.string()
              .required("Heure de fin requise")
              .test(
                "is-after-start",
                "L'heure de fin doit être après l'heure de début.",
                function (endTime) {
                  const { startTime, date } = this.parent;
                  if (!startTime || !endTime || !date) return true;

                  const [startH, startM] = startTime.split(":").map(Number);
                  const [endH, endM] = endTime.split(":").map(Number);

                  const start = new Date(date);
                  start.setHours(startH, startM, 0, 0);

                  const end = new Date(date);
                  end.setHours(endH, endM, 0, 0);

                  // Si “end” est avant (ou égal) “start”, on le considère comme le jour suivant
                  if (end <= start) {
                    end.setDate(end.getDate() + 1);
                  }
                  return end > start;
                }
              ),
            // location doit valider l'une des deux chaînes
            location: Yup.string()
              .oneOf(
                ["Boulevard des arts", "AMI Assurances"],
                "Lieu invalide"
              )
              .required("Le lieu est requis"),
          })}
          onSubmit={async (values, { setSubmitting, resetForm }) => {
            try {
              const data = {
                ...values,
                concert: values.concert || null,
                location: values.location,
              };

              if (editing) {
                await updateRepetition(editing._id, data);
                Swal.fire(
                  "Succès",
                  "Répétition modifiée avec succès.",
                  "success"
                );
              } else {
                await createRepetition(data);
                Swal.fire("Succès", "Répétition créée avec succès.", "success");
              }

              fetchAll();
              resetForm();
              setEditing(null);
              setShowModal(false);
            } catch (err) {
              if (err.response?.status === 409) {
                await Swal.fire({
                  icon: "error",
                  title: "Erreur",
                  text: "Une répétition à cette date existe déjà.",
                });
              } else {
                Swal.fire(
                  "Erreur",
                  err.response?.data?.message || "Une erreur est survenue.",
                  "error"
                );
              }
            } finally {
              setSubmitting(false);
            }
          }}
        >
          {({
            handleSubmit,
            handleChange,
            setFieldValue,
            values,
            errors,
            touched,
            isSubmitting,
            isValid,
            dirty,
            handleBlur,
          }) => (
            <Form noValidate onSubmit={handleSubmit}>
              <Modal.Body>
                <Row className="mb-2">
                  <Col>
                    <Form.Group>
                      <Form.Label>Date</Form.Label>
                      <Form.Control
                        type="date"
                        name="date"
                        value={values.date}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        isInvalid={touched.date && !!errors.date}
                        min={todayString}
                      />
                      <Form.Control.Feedback type="invalid">
                        {errors.date}
                      </Form.Control.Feedback>
                    </Form.Group>
                  </Col>
                  <Col>
                    <Form.Group>
                      <Form.Label>Heure début</Form.Label>
                      <Form.Control
                        type="time"
                        name="startTime"
                        value={values.startTime}
                        onChange={(e) => {
                          const newStart = e.target.value;
                          // si on est aujourd'hui, on n’accepte pas une heure antérieure à nowHM
                          if (values.date === todayString && newStart < nowHM)
                            return;
                          handleChange(e);

                          // on avance “endTime” de 2h automatiquement
                          const [h, m] = newStart.split(":").map(Number);
                          const dt = new Date();
                          dt.setHours(h, m);
                          dt.setHours(dt.getHours() + 2);
                          setFieldValue("endTime", dt.toTimeString().slice(0, 5));
                        }}
                        onBlur={handleBlur}
                        isInvalid={touched.startTime && !!errors.startTime}
                        {...(values.date === todayString
                          ? { min: nowHM }
                          : {})}
                      />
                      <Form.Control.Feedback type="invalid">
                        {errors.startTime}
                      </Form.Control.Feedback>
                    </Form.Group>
                  </Col>
                  <Col>
                    <Form.Group>
                      <Form.Label>Heure fin</Form.Label>
                      <Form.Control
                        type="time"
                        name="endTime"
                        value={values.endTime}
                        readOnly
                      />
                    </Form.Group>
                  </Col>
                </Row>

                {/* === Lieu (sélection fixe) === */}
                <Form.Group className="mb-2">
                  <Form.Label>Lieu</Form.Label>
                  <Select
                    name="location"
                    options={lieuOptions}
                    value={
                      values.location
                        ? lieuOptions.find((opt) => opt.value === values.location)
                        : null
                    }
                    onChange={(opt) =>
                      setFieldValue("location", opt ? opt.value : "")
                    }
                    onBlur={() => handleBlur({ target: { name: "location" } })}
                    className={touched.location && errors.location ? "is-invalid" : ""}
                  />
                  {touched.location && errors.location && (
                    <div className="invalid-feedback d-block">
                      {errors.location}
                    </div>
                  )}
                </Form.Group>

                {/* === Concert lié (sélecteur dynamique) === */}
                <Form.Group className="mb-2">
                  <Form.Label>Concert lié (optionnel)</Form.Label>
                  <Select
                    name="concert"
                    isClearable
                    options={concerts.map((c) => ({
                      value: c._id,
                      label: `${c.title} – ${new Date(
                        c.dateHeure
                      ).toLocaleDateString("fr-FR")}`,
                    }))}
                    /* ---------- CLÉ DU CORRECTIF ---------- */
                    /* On fournit directement un objet { value, label } ou null, et non une fonction */
                    value={
                      values.concert
                        ? (() => {
                            const sel = concerts.find(
                              (c) => c._id.toString() === values.concert
                            );
                            return sel
                              ? {
                                  value: sel._id,
                                  label: `${sel.title} – ${new Date(
                                    sel.dateHeure
                                  ).toLocaleDateString("fr-FR")}`,
                                }
                              : null;
                          })()
                        : null
                    }
                    onChange={(opt) =>
                      setFieldValue("concert", opt ? opt.value : "")
                    }
                    onBlur={() => handleBlur({ target: { name: "concert" } })}
                  />
                </Form.Group>

                <Form.Group className="mb-2">
                  <Form.Label>Pupitres concernés</Form.Label>
                  {pupitreOptions.map((p) => (
                    <Form.Check
                      key={p.value}
                      type="checkbox"
                      label={p.label}
                      checked
                      disabled
                    />
                  ))}
                </Form.Group>
              </Modal.Body>

              <Modal.Footer>
                <Button variant="secondary" onClick={() => setShowModal(false)}>
                  Annuler
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  disabled={isSubmitting || !isValid || (editing && !dirty)}
                >
                  {editing ? "Mettre à jour" : "Créer"}
                </Button>
              </Modal.Footer>
            </Form>
          )}
        </Formik>
      </Modal>
    </div>
  );
};

export default ManageRehearsals;
