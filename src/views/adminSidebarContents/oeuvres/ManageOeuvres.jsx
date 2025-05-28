/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable prettier/prettier */
import { BACKEND_URL } from "../../../utils/axiosInstance";
import React, { useEffect, useState } from "react";
import { Eye, DownloadCloud } from "lucide-react";
import CreatableSelect from "react-select/creatable";
import {
  getOeuvres,
  createOeuvre,
  updateOeuvre,
  // deleteOeuvrePermanent,
} from "../../../services/oeuvre.service";
import { Button, Form, Modal, Table, Col, Row, Spinner } from "react-bootstrap";
import Swal from "sweetalert2";
import { Formik } from "formik";
import * as Yup from "yup";

const ITEMS_PER_PAGE = 5;

const ManageOeuvres = () => {
  const [oeuvres, setOeuvres] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [genres, setGenres] = useState([]);
  const baseGenres = ["Classique", "Gospel", "Jazz"];
  const genreOptions = genres.map((g) => ({
    label: g,
    value: g,
  }));

const fetchOeuvres = async () => {
  setLoading(true);
  try {
    const data = await getOeuvres();
    setOeuvres(data);

    // ⤵️ Combine static + dynamic genres
    const fetchedGenres = data.map((o) => o.genre).filter(Boolean);
    const allGenres = [...baseGenres, ...fetchedGenres];
    const uniqueGenres = [...new Set(allGenres)];
    setGenres(uniqueGenres);

  } catch (err) {
    console.error("Erreur de chargement", err);
  } finally {
    setLoading(false);
  }
};


  useEffect(() => {
    fetchOeuvres();
  }, []);

  const filtered = oeuvres.filter((o) =>
    o.title.toLowerCase().includes(searchTerm.toLowerCase())
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
  //     await deleteOeuvrePermanent(id);
  //     fetchOeuvres();
  //     Swal.fire(
  //       "Supprimée",
  //       "L’œuvre a été supprimée définitivement.",
  //       "success"
  //     );
  //   }
  // };

  // opens the PDF in a SweetAlert iframe
  const handlePdfPreview = (filename) => {
    Swal.fire({
      title: "Aperçu PDF",
      html: `<iframe
      src="${BACKEND_URL}/uploads/documents/${filename}"
      width="100%" height="600px" style="border:none;"
    ></iframe>`,
      width: 800,
      showCloseButton: true,
      showConfirmButton: false,
    });
  };

  // opens the PDF in a new tab for download
  const handlePdfDownload = (filename) => {
    const url = `${BACKEND_URL}/uploads/documents/${filename}`;
    // open in a new blank tab
    window.open(url, "_blank");
  };

  return (
    <div className="p-4">
      <div className="d-flex justify-content-between mb-3">
        <Form.Control
          placeholder="Rechercher par titre"
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
          + Ajouter une œuvre
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
                <th>Compositeurs</th>
                <th>Arrangeurs</th>
                <th>Genre</th>
                <th>Chœur requis</th>
                <th>Paroles (PDF)</th>
                <th>Partition (PDF)</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {paginated.map((o, index) => (
                <tr key={o._id}>
                  <td>{(currentPage - 1) * ITEMS_PER_PAGE + index + 1}</td>
                  <td>{o.title}</td>
                  <td>{o.composers.join(", ")}</td>

                  <td>{o.arrangers.join(", ")}</td>
                  <td>{o.genre || "-"}</td>
                  <td>{o.requiresChoir ? "Oui" : "Non"}</td>

                  <td className="text-center align-middle">
                    {o.lyrics ? (
                      <div className="d-inline-flex align-items-center justify-content-center gap-3">
                        <Button
                          variant="link"
                          className="p-0 text-primary"
                          onClick={() => handlePdfPreview(o.lyrics)}
                        >
                          <Eye size={20} />
                        </Button>
                        <Button
                          variant="link"
                          className="p-0 text-primary"
                          onClick={() => handlePdfDownload(o.lyrics)}
                        >
                          <DownloadCloud size={20} />
                        </Button>
                      </div>
                    ) : (
                      "-"
                    )}
                  </td>

                  <td className="text-center align-middle">
                    {o.partition ? (
                      <div className="d-inline-flex align-items-center justify-content-center gap-3">
                        <Button
                          variant="link"
                          className="p-0 text-primary"
                          onClick={() => handlePdfPreview(o.partition)}
                        >
                          <Eye size={20} />
                        </Button>
                        <Button
                          variant="link"
                          className="p-0 text-primary"
                          onClick={() => handlePdfDownload(o.partition)}
                        >
                          <DownloadCloud size={20} />
                        </Button>
                      </div>
                    ) : (
                      "-"
                    )}
                  </td>

                  <td>
                    <Button
                      size="sm"
                      variant="warning"
                      className="me-2"
                      onClick={() => {
                        setEditing(o);
                        setShowModal(true);
                      }}
                    >
                      Modifier
                    </Button>
                    {/* <Button
                      size="sm"
                      variant="danger"
                      onClick={() => handlePermanentDelete(o._id)}
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
              {currentPage > 1 && (
                <>
                  <Button size="sm" onClick={() => setCurrentPage(1)}>
                    {"<<"}
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => setCurrentPage(currentPage - 1)}
                  >
                    {"<"}
                  </Button>
                </>
              )}
              {Array.from({ length: pageCount }, (_, i) => i + 1).map(
                (page) => (
                  <Button
                    key={page}
                    size="sm"
                    variant={
                      page === currentPage ? "primary" : "outline-secondary"
                    }
                    onClick={() => setCurrentPage(page)}
                  >
                    {page}
                  </Button>
                )
              )}
              {currentPage < pageCount && (
                <>
                  <Button
                    size="sm"
                    onClick={() => setCurrentPage(currentPage + 1)}
                  >
                    {">"}
                  </Button>
                  <Button size="sm" onClick={() => setCurrentPage(pageCount)}>
                    {">>"}
                  </Button>
                </>
              )}
            </div>
          )}
        </>
      )}

      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            {editing ? "Modifier une œuvre" : "Ajouter une œuvre"}
          </Modal.Title>
        </Modal.Header>

        <Formik
          initialValues={{
            title: editing?.title || "",
            composers: editing?.composers?.join(", ") || "",
            arrangers: editing?.arrangers?.join(", ") || "",
            year: editing?.year || "",
            genre: editing?.genre || "",
            lyrics: null,
            partition: null,
            requiresChoir: editing?.requiresChoir || false,
          }}
          validationSchema={Yup.object({
            title: Yup.string().required("Le titre est requis"),
            composers: Yup.string().required(
              "Au moins un compositeur est requis"
            ),
            arrangers: Yup.string().required(
              "Au moins un arrangeur est requis"
            ),
            year: Yup.number()
              .typeError("L'année doit être un nombre")
              .required("L'année est requise"),
            genre: Yup.string().required("Le genre est requis"),
          })}
          onSubmit={async (values, { setSubmitting, resetForm }) => {
            const formData = new FormData();
            formData.append("title", values.title);
            formData.append("composers", values.composers);
            formData.append("arrangers", values.arrangers);
            formData.append("year", values.year);
            formData.append("genre", values.genre);
            formData.append("requiresChoir", values.requiresChoir);

            if (values.lyrics) {
              formData.append("lyrics", values.lyrics);
            }
            if (values.partition) {
              formData.append("partition", values.partition);
            }

            const save = async () => {
              if (editing) {
                await updateOeuvre(editing._id, formData);
                Swal.fire("Modifiée", "L’œuvre a été mise à jour.", "success");
              } else {
                await createOeuvre(formData);
                Swal.fire("Créée", "L’œuvre a été ajoutée.", "success");
              }

              fetchOeuvres();
              resetForm();
              setShowModal(false);
              setEditing(null);
            };

            save()
              .catch(() => {
                Swal.fire("Erreur", "Échec de l'opération.", "error");
              })
              .finally(() => setSubmitting(false));
          }}
        >
          {({
            handleSubmit,
            handleChange,
            handleBlur,
            values,
            touched,
            errors,
            isSubmitting,
            isValid,
            dirty,
            setFieldValue,
          }) => (
            <Form noValidate onSubmit={handleSubmit}>
              <Modal.Body className="px-3 py-2">
                <Row className="mb-2">
                  <Col sm={6}>
                    <Form.Group>
                      <Form.Label>Titre</Form.Label>
                      <Form.Control
                        name="title"
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
                  <Col sm={6}>
                    <Form.Group>
                      <Form.Label>Année</Form.Label>
                      <Form.Control
                        name="year"
                        type="number"
                        value={values.year}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        isInvalid={touched.year && !!errors.year}
                      />
                      <Form.Control.Feedback type="invalid">
                        {errors.year}
                      </Form.Control.Feedback>
                    </Form.Group>
                  </Col>
                </Row>

                <Row className="mb-2">
                  <Col sm={6}>
                    <Form.Group>
                      <Form.Label>
                        Compositeurs (séparés par virgule)
                      </Form.Label>
                      <Form.Control
                        name="composers"
                        value={values.composers}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        isInvalid={touched.composers && !!errors.composers}
                      />
                      <Form.Control.Feedback type="invalid">
                        {errors.composers}
                      </Form.Control.Feedback>
                    </Form.Group>
                  </Col>
                  <Col sm={6}>
                    <Form.Group>
                      <Form.Label>Arrangeurs (séparés par virgule)</Form.Label>
                      <Form.Control
                        name="arrangers"
                        value={values.arrangers}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        isInvalid={touched.arrangers && !!errors.arrangers}
                      />
                      <Form.Control.Feedback type="invalid">
                        {errors.arrangers}
                      </Form.Control.Feedback>
                    </Form.Group>
                  </Col>
                </Row>

                <Row className="mb-2">
                  <Col sm={6}>
                    <Form.Group>
                      <Form.Label>Paroles (PDF)</Form.Label>
                      <Form.Control
                        name="lyrics"
                        type="file"
                        accept="application/pdf"
                        onChange={(e) =>
                          setFieldValue("lyrics", e.currentTarget.files[0])
                        }
                      />
                    </Form.Group>
                  </Col>
                  <Col sm={6}>
                    <Form.Group>
                      <Form.Label>Partition (PDF)</Form.Label>
                      <Form.Control
                        name="partition"
                        type="file"
                        accept="application/pdf"
                        onChange={(e) =>
                          setFieldValue("partition", e.currentTarget.files[0])
                        }
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Form.Group>
                  <Form.Label>Genre</Form.Label>
                  <CreatableSelect
                    name="genre"
                    isClearable
                    options={genreOptions}
                    value={
                      genreOptions.find((o) => o.value === values.genre) ||
                      (values.genre
                        ? { label: values.genre, value: values.genre }
                        : null)
                    }
                    placeholder="Choisir ou écrire un genre..."
                    onChange={(option) =>
                      setFieldValue("genre", option?.value || "")
                    }
                    onBlur={() => handleBlur({ target: { name: "genre" } })}
                    className={
                      touched.genre && errors.genre ? "is-invalid" : ""
                    }
                    createOptionPosition="first"
                  />
                  {touched.genre && errors.genre && (
                    <div className="invalid-feedback d-block">
                      {errors.genre}
                    </div>
                  )}
                </Form.Group>

                <Form.Check
                  className="mt-3"
                  name="requiresChoir"
                  type="checkbox"
                  label="Cette œuvre nécessite le chœur"
                  checked={values.requiresChoir}
                  onChange={handleChange}
                />
              </Modal.Body>
              <Modal.Footer>
                <Button variant="secondary" onClick={() => setShowModal(false)}>
                  Annuler
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  disabled={
                    isSubmitting ||
                    (!editing && !isValid) ||
                    (editing && !dirty)
                  }
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

export default ManageOeuvres;
