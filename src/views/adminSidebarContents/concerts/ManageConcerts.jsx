/* eslint-disable jsx-a11y/click-events-have-key-events */
/* eslint-disable jsx-a11y/no-noninteractive-element-interactions */
/* eslint-disable prettier/prettier */
import React, { useEffect, useState } from "react";
import {
  getConcerts,
  createConcert,
  updateConcert,
  // deleteConcertPermanent,
} from "../../../services/concert.service";
import { Eye } from "lucide-react";
import { getOeuvres } from "../../../services/oeuvre.service";
import { Button, Form, Modal, Table, Col, Row, Spinner } from "react-bootstrap";
import CreatableSelect from "react-select/creatable";
import Select from "react-select";
import { Formik } from "formik";
import * as Yup from "yup";
import Swal from "sweetalert2";
import { BACKEND_URL } from "../../../utils/axiosInstance";

const ITEMS_PER_PAGE = 5;

const ManageConcerts = () => {
  const [concerts, setConcerts] = useState([]);
  const [oeuvres, setOeuvres] = useState([]);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const formatDateTime = (isoString) => {
    const d = new Date(isoString);

    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, "0");
    const minutes = String(d.getMinutes()).padStart(2, "0");

    return `${day}/${month}/${year}, ${hours}:${minutes}`;
  };

  const now = new Date();
  const pad = (n) => String(n).padStart(2, "0");

  // local YYYY-MM-DD
  const todayString = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;

  // local HH:MM
  const nowHM = `${pad(now.getHours())}:${pad(now.getMinutes())}`;

  const formatConcertDateFR = (isoString) => {
    return new Date(isoString).toLocaleDateString("fr-FR", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [activeConcerts, allOeuvres] = await Promise.all([
        getConcerts(),
        getOeuvres(),
      ]);
      setConcerts(activeConcerts);
      setOeuvres(allOeuvres);
      const uniqueLocations = [
        ...new Set(activeConcerts.map((c) => c.location)),
      ].map((l) => ({ label: l, value: l }));
      setLocations(uniqueLocations);
    } catch (err) {
      console.error("Erreur de chargement:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const filtered = concerts.filter((c) =>
    c.location.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const pageCount = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated = filtered.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  // const handlePermanentDelete = async (id) => {
  //   const { isConfirmed } = await Swal.fire({
  //     title: "Supprimer définitivement ?",
  //     text: "Cette action est irréversible.",
  //     icon: "warning",
  //     showCancelButton: true,
  //     confirmButtonText: "Oui, supprimer",
  //   });
  //   if (isConfirmed) {
  //     await deleteConcertPermanent(id);
  //     fetchAll();
  //     Swal.fire(
  //       "Supprimé",
  //       "Le concert a été supprimé définitivement.",
  //       "success"
  //     );
  //   }
  // };

  const handleSubmit = async (values, { setSubmitting, resetForm }) => {
    const formData = new FormData(); // ← Make sure this line is here!
    try {
      const fullDateTime = new Date(`${values.date}T${values.time}`);
      formData.append("title", values.title);
      formData.append("dateHeure", fullDateTime.toISOString());
      formData.append("location", values.location.value);
      formData.append(
        "programme",
        JSON.stringify(values.programme.map((o) => o.value))
      );
      if (values.poster instanceof File) {
        formData.append("poster", values.poster);
      }

      if (editing) {
        await updateConcert(editing._id, formData);
        Swal.fire("Mis à jour", "Le concert a été modifié.", "success");
      } else {
        await createConcert(formData);
        Swal.fire("Créé", "Le concert a été ajouté.", "success");
      }

      await fetchAll(); // refresh the table
      resetForm();
      setShowModal(false);
      setEditing(null);
      setCurrentPage(1); // optional: go back to page 1
    } catch (err) {
      Swal.fire(
        "Erreur",
        err.response?.data?.message || "Échec de l'opération.",
        "error"
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleViewProgramme = (programme, concertDate) => {
    const formattedDate = formatConcertDateFR(concertDate);
    // const dateObj = new Date(concertDate);
    // const formattedTime = dateObj.toLocaleTimeString("fr-FR", {
    //   hour: "2-digit",
    //   minute: "2-digit",
    // });
    //   <span style="margin-left:0.5rem; font-weight:500; color:#555;">
    //   à ${formattedTime}
    // </span>

    // const arrangersString = allArrangers.length ? allArrangers.join(", ") : "—";
    // build each piece card
    const piecesHtml = programme
      .map((o) => {
        // ① define these before using them:
        const composers = o.composers.join(", ");
        const arrangers =
          o.arrangers && o.arrangers.length ? o.arrangers.join(", ") : "—";

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
            </strong>
            ${composers}
          </div>
          <div style="margin-top:4px;">
            <strong style="font-size:16px; font-style: italic;">
              Arrangeurs:
            </strong>
            ${arrangers}
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
              background:rgb(76, 89, 104); /* Sidebar dark blue */
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
          .prog-header .icon {
            font-size: 24px;
            margin: 0 12px;
            vertical-align: middle;
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
    color: #26394E; /* Same sidebar color */
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
    border-left: 4px solid #26394E; /* Sidebar blue accent */
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
          .prog-card-meta {
            margin-top: 6px;
            font-size: 0.82rem;
            color: #888;
            font-style: italic;
          }
          .prog-footer {
            background: #f1f5f9;
            text-align: center;
            font-size: 14px;
            color: #5e5043;
            font-style: italic;
            padding:20px 32px;
            
          }
          .swal2-programme-popup {
            background: transparent !important;
            box-shadow: none !important;
          }
        .swal2-programme-popup {
    background: transparent !important;
    box-shadow: none !important;
  }
  .prog-footer .arrangers-list {
    display: inline-block;
    margin-left: 6px;
    font-style: normal;
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
          <!-- Header -->
          <div class="prog-header">
            <span class="icon"></span>
            <h1>Orchestre Symphonique de Carthage</h1>
            <span class="icon"></span>
          </div>
  
          <!-- Logo & Date -->
        <div class="prog-subheader">
          <img src="../../src/assets/images/music.png" alt="CSO Logo" />
          <p>
            Programme du ${formattedDate}
          
          </p>
        </div>

  
          <!-- Pieces List -->
          <div class="prog-body">
            ${piecesHtml}
          </div>
  

          
          <!-- Footer -->
<div class="prog-footer" >
  
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
  };

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
          + Ajouter un concert
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
                <th>Titre</th>
                <th>Date &amp; Heure</th>
                <th>Lieu</th>
                <th>Programme</th>
                <th>Affiche</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginated.map((concert, idx) => (
                <tr key={concert._id}>
                  <td>{(currentPage - 1) * ITEMS_PER_PAGE + idx + 1}</td>
                  <td>{concert.title}</td>
                  <td>{formatDateTime(concert.dateHeure)}</td>
                  <td>{concert.location}</td>
                  <td className="text-center align-middle">
                    <div
                      className="d-flex justify-content-center align-items-center"
                      style={{ height: "100%" }}
                    >
                      <Button
                        className="p-0 text-primary"
                        variant="link"
                        onClick={() =>
                          handleViewProgramme(
                            concert.programme,
                            concert.dateHeure
                          )
                        }
                      >
                        <Eye size={20} />
                      </Button>
                    </div>
                  </td>

                  <td>
                    {concert.poster ? (
                      <img
                        src={`${BACKEND_URL}/uploads/posters/${concert.poster}`}
                        alt="Affiche"
                        style={{
                          width: 50,
                          cursor: "zoom-in",
                          borderRadius: 4,
                        }}
                        onClick={() =>
                          Swal.fire({
                            imageUrl: `${BACKEND_URL}/uploads/posters/${concert.poster}`,
                            imageAlt: "Zoom affiche",
                            showCloseButton: true,
                            showConfirmButton: false,
                            background: "#fff",
                          })
                        }
                      />
                    ) : (
                      "-"
                    )}
                  </td>
                  <td>
                    <Button
                      size="sm"
                      className="me-2"
                      variant="warning"
                      onClick={() => {
                        const d = new Date(concert.dateHeure);
                        setEditing({
                          ...concert,
                          date: d.toISOString().substring(0, 10),
                          time: d.toTimeString().substring(0, 5),
                          location: {
                            label: concert.location,
                            value: concert.location,
                          },
                          programme: concert.programme.map((o) => ({
                            value: o._id,
                            label: o.title,
                          })),
                          previewPoster: concert.poster
                            ? `${BACKEND_URL}/uploads/posters/${concert.poster}`
                            : "",
                          poster: concert.poster || "",
                        });
                        setShowModal(true);
                      }}
                    >
                      Modifier
                    </Button>
                    {/* <Button
                      size="sm"
                      variant="danger"
                      onClick={() => handlePermanentDelete(concert._id)}
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
            {editing ? "Modifier un concert" : "Ajouter un concert"}
          </Modal.Title>
        </Modal.Header>

        <Formik
          initialValues={{
            date: editing?.date || todayString,
            time: editing?.time || nowHM,
            location: editing?.location || null,
            poster: editing?.poster || "",
            previewPoster: editing?.previewPoster || "",
            programme: editing?.programme || [],
            title: editing?.title || "",
          }}
          validationSchema={Yup.object({
            title: Yup.string().required("Le titre est requis"),
            date: Yup.string().required("Date requise"),
            time: Yup.string().required("Heure requise"),
            location: Yup.object().nullable().required("Lieu requis"),
            programme: Yup.array().min(1, "Au moins une œuvre est requise"),
          })}
          onSubmit={handleSubmit}
        >
          {({
            handleSubmit,
            handleChange,
            setFieldValue,
            values,
            errors,
            touched,
            handleBlur,
            isValid,
            dirty,
            isSubmitting,
          }) => (
            <Form noValidate onSubmit={handleSubmit}>
              <Modal.Body>
                <Row className="mb-3">
                  <Col>
                    <Form.Group className="mb-3">
                      <Form.Label>Titre du concert</Form.Label>
                      <Form.Control
                        type="text"
                        name="title"
                        placeholder="Ex: Concert de Printemps"
                        value={values.title}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        isInvalid={touched.title && !!errors.title}
                      />
                      <Form.Control.Feedback type="invalid">
                        {errors.title}
                      </Form.Control.Feedback>
                    </Form.Group>
                  </Col>
                  <Col>
                    <Form.Group>
                      <Form.Label>Date</Form.Label>
                      <Form.Control
                        type="date"
                        name="date"
                        value={values.date}
                        min={todayString} // ← only allow today or future
                        onChange={handleChange}
                        onBlur={handleBlur}
                        isInvalid={touched.date && !!errors.date}
                      />

                      <Form.Control.Feedback type="invalid">
                        {errors.date}
                      </Form.Control.Feedback>
                    </Form.Group>
                  </Col>
                  <Col>
                    <Form.Group>
                      <Form.Label>Heure</Form.Label>
                      <Form.Control
                        type="time"
                        name="time"
                        value={values.time}
                        onChange={(e) => {
                          const newTime = e.target.value;
                          // if the selected date is today, disallow any time before nowHM
                          if (values.date === todayString && newTime < nowHM)
                            return;
                          handleChange(e);
                        }}
                        onBlur={handleBlur}
                        isInvalid={touched.time && !!errors.time}
                        {...(values.date === todayString
                          ? { min: nowHM } // enforce min time only on today
                          : {})}
                      />

                      <Form.Control.Feedback type="invalid">
                        {errors.time}
                      </Form.Control.Feedback>
                    </Form.Group>
                  </Col>
                </Row>

                <Form.Group className="mb-3">
                  <Form.Label>Lieu</Form.Label>
                  <CreatableSelect
                    isClearable
                    options={locations}
                    value={values.location}
                    onChange={(val) => setFieldValue("location", val)}
                    onBlur={() => handleBlur({ target: { name: "location" } })}
                    className={
                      touched.location && errors.location ? "is-invalid" : ""
                    }
                  />
                  {touched.location && errors.location && (
                    <div className="invalid-feedback d-block">
                      {errors.location}
                    </div>
                  )}
                </Form.Group>

                <Form.Group className="mb-2">
                  <Form.Label>Affiche (image) (optionnel)</Form.Label>
                  <Form.Control
                    type="file"
                    name="poster"
                    onChange={(e) => {
                      const file = e.currentTarget.files[0];
                      setFieldValue("poster", file);
                      if (file) {
                        setFieldValue(
                          "previewPoster",
                          URL.createObjectURL(file)
                        );
                      }
                    }}
                    accept="image/*"
                  />

                  {values.previewPoster && (
                    <div className="mt-3 d-flex flex-column align-items-center text-center">
                      <img
                        src={values.previewPoster}
                        alt="Affiche preview"
                        style={{
                          maxWidth: "100%",
                          maxHeight: "300px",
                          borderRadius: "8px",
                          boxShadow: "0 0 6px rgba(0,0,0,0.1)",
                          cursor: "zoom-in",
                        }}
                        onClick={() =>
                          Swal.fire({
                            imageUrl: values.previewPoster,
                            imageAlt: "Zoom affiche",
                            showCloseButton: true,
                            showConfirmButton: false,
                          })
                        }
                      />
                      <Button
                        variant="outline-danger"
                        size="sm"
                        className="mt-2"
                        onClick={() => {
                          setFieldValue("poster", "");
                          setFieldValue("previewPoster", "");
                        }}
                      >
                        Supprimer l’affiche
                      </Button>
                    </div>
                  )}
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Programme</Form.Label>
                  <Select
                    isMulti
                    options={oeuvres.map((o) => ({
                      label: o.title,
                      value: o._id,
                    }))}
                    value={values.programme}
                    onChange={(val) => setFieldValue("programme", val)}
                    onBlur={() => handleBlur({ target: { name: "programme" } })}
                    className={
                      touched.programme && errors.programme ? "is-invalid" : ""
                    }
                  />
                  {touched.programme && errors.programme && (
                    <div className="invalid-feedback d-block">
                      {errors.programme}
                    </div>
                  )}
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

export default ManageConcerts;
