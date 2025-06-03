/* eslint-disable prettier/prettier */
import React, { useEffect, useState } from "react";
import { Button, Form, Modal, Spinner, Table, Row, Col } from "react-bootstrap";
import Select from "react-select";
import Swal from "sweetalert2";
import { Formik } from "formik";
import * as Yup from "yup";
import {
  getUsers,
  getLockedUsers,
  createUser,
  updateUser,
  deleteUserPermanent,
  restoreUser,
  lockUser,
} from "../../../services/accounts.service";
import { useAuth } from "../../../contexts/AuthContext";

const ITEMS_PER_PAGE = 5;

const ManageAccounts = () => {
  const [users, setUsers] = useState([]);
  const [lockedUsers, setLockedUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [tab, setTab] = useState("active");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const { refreshUser } = useAuth();

  // Options for react-select fields
  const roleOptions = [
    { value: "choriste", label: "Choriste" },
    { value: "manager", label: "Manager de choeur" },
    { value: "chef de choeur", label: "Chef de choeur" },
  ];

  const genderOptions = [
    { value: "Homme", label: "Homme" },
    { value: "Femme", label: "Femme" },
  ];

  // const pupitreOptions = [
  //   { value: "soprano", label: "Soprano" },
  //   { value: "alto", label: "Alto" },
  //   { value: "ténor", label: "Ténor" },
  //   { value: "basse", label: "Basse" },
  // ];

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const active = await getUsers();
      const locked = await getLockedUsers();
      setUsers(active);
      setLockedUsers(locked.lockedUsers);
    } catch (err) {
      console.error("Erreur lors de la récupération des utilisateurs:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const filtered = (tab === "active" ? users : lockedUsers).filter((user) => {
    const fullName = `${user.firstName} ${user.lastName}`.toLowerCase();
    return fullName.includes(searchTerm.toLowerCase());
  });

  const pageCount = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated = filtered.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const renderPagination = () => {
    const pages = [];
    const visible = 3;
    const start = Math.max(1, currentPage - visible);
    const end = Math.min(pageCount, currentPage + visible);

    if (currentPage > 1) {
      pages.push(
        <Button key="first" size="sm" onClick={() => setCurrentPage(1)}>
          {"<<"}
        </Button>
      );
      pages.push(
        <Button
          key="prev"
          size="sm"
          onClick={() => setCurrentPage(currentPage - 1)}
        >
          {"<"}
        </Button>
      );
    }

    for (let i = start; i <= end; i++) {
      pages.push(
        <Button
          key={i}
          variant={i === currentPage ? "primary" : "outline-secondary"}
          size="sm"
          className="me-1"
          onClick={() => setCurrentPage(i)}
        >
          {i}
        </Button>
      );
    }

    if (currentPage < pageCount) {
      pages.push(
        <Button
          key="next"
          size="sm"
          onClick={() => setCurrentPage(currentPage + 1)}
        >
          {">"}
        </Button>
      );
      pages.push(
        <Button key="last" size="sm" onClick={() => setCurrentPage(pageCount)}>
          {">>"}
        </Button>
      );
    }

    return (
      <div className="d-flex justify-content-center mt-3 flex-wrap gap-1">
        {pages}
      </div>
    );
  };

  const handlePermanentDelete = async (id) => {
    const { isConfirmed } = await Swal.fire({
      title: "Suppression définitive ?",
      text: "Cette action est irréversible.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Oui, supprimer définitivement !",
    });
    if (isConfirmed) {
      await deleteUserPermanent(id);
      fetchUsers();
      Swal.fire(
        "Supprimé !",
        "Le compte a été supprimé définitivement.",
        "success"
      );
    }
  };

  const handleDelete = async (id) => {
    const confirm = await Swal.fire({
      title: "Êtes-vous sûr ?",
      text: "Voulez-vous verrouiller ce compte ?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Oui, verrouiller !",
    });
    if (confirm.isConfirmed) {
      await lockUser(id);
      fetchUsers();
      Swal.fire("Verrouillé !", "Le compte a été verrouillé.", "success");
    }
  };

  const handleRestore = async (id) => {
    await restoreUser(id);
    fetchUsers();
    Swal.fire("Rétabli !", "Le compte a été rétabli.", "success");
  };

const handleSubmit = async (values, { setSubmitting, resetForm }) => {
  try {
    // 1) Vérifier la présence du CIN uniquement si c’est un choriste
    if (values.role === "choriste" && !values.cin) {
      Swal.fire("Erreur", "Le CIN est requis pour un choriste.", "error");
      setSubmitting(false);
      return;
    }

    // 2) Vérifier doublon d’email OU de CIN (si choriste)
    if (editingUser) {
      const collision = users.find((u) => {
        const sameEmail = u.email === values.email && u._id !== editingUser._id;
        const sameCin =
          values.role === "choriste" &&
          u.cin === values.cin &&
          u._id !== editingUser._id;
        return sameEmail || sameCin;
      });
      if (collision) {
        Swal.fire(
          "Erreur",
          "Un utilisateur avec cet email ou ce CIN existe déjà.",
          "error"
        );
        setSubmitting(false);
        return;
      }
    } else {
      const collision = users.find((u) => {
        const sameEmail = u.email === values.email;
        const sameCin = values.role === "choriste" && u.cin === values.cin;
        return sameEmail || sameCin;
      });
      if (collision) {
        Swal.fire(
          "Erreur",
          "Un utilisateur avec cet email ou ce CIN existe déjà.",
          "error"
        );
        setSubmitting(false);
        return;
      }
    }

    const currentUserId = localStorage.getItem("userId");

    if (editingUser) {
      // 3) Déterminer si l’email ou le CIN a changé
      const emailChanged = editingUser.email !== values.email;
      const cinChanged =
        values.role === "choriste" && editingUser.cin !== values.cin;

      // 4) Afficher loader si nécessaire
      if (emailChanged || cinChanged) {
        Swal.fire({
          title: "Modification du compte…",
          text: "Veuillez patienter pendant l’envoi des identifiants.",
          allowOutsideClick: false,
          allowEscapeKey: false,
          didOpen: () => Swal.showLoading(),
        });
      }

      // 5) Appeler l’API de mise à jour
      await updateUser(editingUser._id, values);
      if (editingUser._id === currentUserId) {
        await refreshUser();
      }

      // 6) Fermer le loader si on l’a ouvert
      if (emailChanged || cinChanged) {
        Swal.close();
      }

      // 7) Afficher message de succès
      Swal.fire(
        "Succès",
        emailChanged || cinChanged
          ? "L'utilisateur a été modifié avec succès. Les identifiants ont été renvoyés à la nouvelle adresse email ou au nouveau CIN."
          : "L'utilisateur a été modifié avec succès.",
        "success"
      );
    } else {
      // 8) Branche création
      Swal.fire({
        title: "Création du compte…",
        text: "Veuillez patienter pendant l’envoi des identifiants.",
        allowOutsideClick: false,
        allowEscapeKey: false,
        didOpen: () => Swal.showLoading(),
      });
      await createUser(values);
      Swal.close();
      Swal.fire(
        "Succès",
        "L’utilisateur a été créé avec succès. Les identifiants ont été envoyés par email.",
        "success"
      );
    }

    // 9) Rafraîchir la liste, réinitialiser le formulaire, fermer la modale
    fetchUsers();
    resetForm();
    setShowModal(false);
    setEditingUser(null);
  } catch (err) {
    const message = err?.response?.data?.message || "Échec de l'opération.";
    Swal.fire(
      "Erreur",
      message.includes("exists") ? "Cet utilisateur existe déjà." : message,
      "error"
    );
  } finally {
    setSubmitting(false);
  }
};



  return (
    <div className="p-4">
      <div className="mb-3">
        <div className="d-flex gap-4">
          <button
            className={`btn ${tab === "active" ? "btn-primary" : "btn-link text-primary"}`}
            onClick={() => setTab("active")}
          >
            Comptes Actifs
          </button>
          <button
            className={`btn ${tab === "locked" ? "btn-primary" : "btn-link text-primary"}`}
            onClick={() => setTab("locked")}
          >
            Comptes Verrouillés
          </button>
        </div>
      </div>

      <div className="d-flex justify-content-between mb-3">
        <Form.Control
          placeholder="Rechercher par nom complet"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ maxWidth: "300px" }}
        />
        {tab === "active" && (
          <Button
            variant="success"
            onClick={() => {
              setEditingUser(null);
              setShowModal(true);
            }}
          >
            + Ajouter un compte
          </Button>
        )}
      </div>

      {loading ? (
        <div className="text-center py-5">
          <Spinner animation="border" />
        </div>
      ) : (
        <>
          <div className="table-responsive">
            {/* <Table bordered hover>
  <thead>
    <tr>
      <th>#</th>
      <th>Prénom</th>
      <th>Nom</th>
      <th>Email</th>
      <th>Rôle</th>
      <th>Genre</th>
      <th>Date de naissance</th>
      <th>Nationalité</th>
      <th>CIN</th>
      <th>Statut personnel</th>
      <th>Connaissance musicale</th>
      <th>Autre activité</th>
      <th>Téléphone</th>
      <th>Pupitre</th>
      <th>Actions</th>
    </tr>
  </thead>
  <tbody>
    {paginated.map((user, index) => (
      <tr key={user._id}>
        <td>{(currentPage - 1) * ITEMS_PER_PAGE + index + 1}</td>
        <td>{user.firstName}</td>
        <td>{user.lastName}</td>
        <td>{user.email}</td>
        <td>{user.role}</td>
        <td>{user.gender || '-'}</td>
        <td>{user.birthDate || '-'}</td>
        <td>{user.nationality || '-'}</td>
        <td>{user.cin || '-'}</td>
        <td>{user.personalStatus || '-'}</td>
        <td>{user.hasMusicalKnowledge ? 'Oui' : 'Non'}</td>
        <td>{user.isActiveInOtherActivities ? 'Oui' : 'Non'}</td>
        <td>{user.phone || '-'}</td>
        <td>{user.pupitre || '-'}</td>
        <td>
          {tab === 'active' ? (
            <>
              <Button
                size="sm"
                variant="warning"
                className="me-2"
                onClick={() => {
                  setEditingUser(user);
                  setShowModal(true);
                }}
              >
                Modifier
              </Button>
              <Button size="sm" variant="danger" onClick={() => handleDelete(user._id)}>
                Verrouiller
              </Button>
            </>
          ) : (
            <Button size="sm" variant="success" onClick={() => handleRestore(user._id)}>
              Restaurer
            </Button>
          )}
        </td>
      </tr>
    ))}
  </tbody>
</Table> */}

            <Table bordered hover>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Nom Complet</th>
                  <th>Email</th>
                  <th>Téléphone</th>
                  <th>Rôle</th>
                  <th>Genre</th>
                  {/* <th>Connaissance musicale</th>
                  <th>Pratique instrumentale</th> */}
                  {/* <th>Taille</th> */}
                  <th>Pupitre</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map((user, index) => (
                  <tr key={user._id}>
                    <td>{(currentPage - 1) * ITEMS_PER_PAGE + index + 1}</td>
                    <td>
                      {user.firstName} {user.lastName}
                    </td>
                    <td>{user.email}</td>
                    <td>{user.phone || "-"}</td>
                    <td>{user.role}</td>
                    <td>{user.gender || "-"}</td>
                    {/* <td>
                      {user.height
                        ? `${(user.height / 100).toFixed(2).replace(".", ",")} m`
                        : "-"}
                    </td> */}

                    {/* <td>{user.hasMusicalKnowledge ? 'Oui' : 'Non'}</td>
                    <td>{user.hasInstrumentalKnowledge ? 'Oui' : 'Non'}</td> */}
                    <td>{user.pupitre || "-"}</td>
                    <td>
                      {tab === "active" ? (
                        <>
                          <Button
                            size="sm"
                            className="me-2"
                            variant="warning"
                            onClick={() => {
                              setEditingUser(user);
                              setShowModal(true);
                            }}
                          >
                            Modifier
                          </Button>
                          <Button
                            size="sm"
                            variant="danger"
                            onClick={() => handleDelete(user._id)}
                          >
                            Verrouiller
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button
                            size="sm"
                            variant="success"
                            onClick={() => handleRestore(user._id)}
                          >
                            Restaurer
                          </Button>
                          <Button
                            size="sm"
                            variant="danger"
                            className="ms-2"
                            onClick={() => handlePermanentDelete(user._id)}
                          >
                            Supprimer
                          </Button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
          {pageCount > 1 && renderPagination()}
        </>
      )}

    <Modal show={showModal} onHide={() => setShowModal(false)}>
  <Modal.Header closeButton>
    <Modal.Title>
      {editingUser ? "Modifier un utilisateur" : "Ajouter un utilisateur"}
    </Modal.Title>
  </Modal.Header>

  <Formik
    initialValues={{
      firstName: editingUser?.firstName || "",
      lastName: editingUser?.lastName || "",
      email: editingUser?.email || "",
      password: "",
      role: editingUser?.role || "",
      gender: editingUser?.gender || "",
      height: editingUser?.height || "",
      birthDate: editingUser?.birthDate || "",
      nationality: editingUser?.nationality || "",
      cin: editingUser?.cin || "",
      hasMusicalKnowledge: editingUser?.hasMusicalKnowledge || false,
      hasInstrumentalKnowledge:
        editingUser?.hasInstrumentalKnowledge || false,
      phone: editingUser?.phone || "",
      pupitre: editingUser?.pupitre || "",
    }}
    validationSchema={Yup.lazy((values) => {
      let shape = {
        firstName: Yup.string().required("Le prénom est requis"),
        lastName: Yup.string().required("Le nom est requis"),
        email: Yup.string()
          .email("Email invalide")
          .required("Email requis"),
        phone: Yup.string().required("Téléphone requis"),
        role: Yup.string().required("Rôle requis"),
      };

      if (values.role === "choriste") {
        shape = {
          ...shape,
          gender: Yup.string().required("Genre requis"),
          birthDate: Yup.string().required("Date de naissance requise"),
          nationality: Yup.string().required("Nationalité requise"),
          cin: Yup.string().required("CIN requis"),
          hasMusicalKnowledge: Yup.boolean().required(),
          hasInstrumentalKnowledge: Yup.boolean().required(),
          height: Yup.string().required("Taille requise"),
          pupitre: Yup.string().required("Pupitre requis"),
        };
      }

      return Yup.object().shape(shape);
    })}
    onSubmit={handleSubmit}
  >
    {({
      values,
      handleChange,
      handleBlur,
      handleSubmit,
      isSubmitting,
      touched,
      errors,
      dirty,
      isValid,
      setFieldValue,
    }) => (
      <Form noValidate onSubmit={handleSubmit}>
        <Modal.Body>
          <Row className="mb-2">
            <Col>
              <Form.Group>
                <Form.Label>Prénom</Form.Label>
                <Form.Control
                  name="firstName"
                  value={values.firstName}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  isInvalid={touched.firstName && !!errors.firstName}
                />
                <Form.Control.Feedback type="invalid">
                  {errors.firstName}
                </Form.Control.Feedback>
              </Form.Group>
            </Col>
            <Col>
              <Form.Group>
                <Form.Label>Nom</Form.Label>
                <Form.Control
                  name="lastName"
                  value={values.lastName}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  isInvalid={touched.lastName && !!errors.lastName}
                />
                <Form.Control.Feedback type="invalid">
                  {errors.lastName}
                </Form.Control.Feedback>
              </Form.Group>
            </Col>
          </Row>

          <Form.Group className="mb-2">
            <Form.Label>Email</Form.Label>
            <Form.Control
              name="email"
              type="email"
              value={values.email}
              onChange={handleChange}
              onBlur={handleBlur}
              isInvalid={touched.email && !!errors.email}
            />
            <Form.Control.Feedback type="invalid">
              {errors.email}
            </Form.Control.Feedback>
          </Form.Group>

          <Form.Group className="mb-2">
            <Form.Label>Téléphone</Form.Label>
            <Form.Control
              name="phone"
              type="number"
              value={values.phone}
              onChange={handleChange}
              onBlur={handleBlur}
              isInvalid={touched.phone && !!errors.phone}
            />
            <Form.Control.Feedback type="invalid">
              {errors.phone}
            </Form.Control.Feedback>
          </Form.Group>

          {/* Sélecteur de rôle */}
          <Form.Group className="mb-2">
            <Form.Label>Rôle</Form.Label>
            <Select
              options={roleOptions}
              name="role"
              value={roleOptions.find((o) => o.value === values.role)}
              onChange={(o) => setFieldValue("role", o.value)}
              onBlur={() => handleBlur({ target: { name: "role" } })}
              className={touched.role && errors.role ? "is-invalid" : ""}
            />
            {touched.role && errors.role && (
              <div className="invalid-feedback d-block">
                {errors.role}
              </div>
            )}
          </Form.Group>

          {values.role === "choriste" && (
            <>
              {/* Genre */}
              <Form.Group className="mb-2">
                <Form.Label>Genre</Form.Label>
                <Select
                  options={genderOptions}
                  name="gender"
                  value={genderOptions.find((o) => o.value === values.gender)}
                  onChange={(o) => setFieldValue("gender", o.value)}
                  onBlur={() => handleBlur({ target: { name: "gender" } })}
                  className={
                    touched.gender && errors.gender ? "is-invalid" : ""
                  }
                />
                {touched.gender && errors.gender && (
                  <div className="invalid-feedback d-block">
                    {errors.gender}
                  </div>
                )}
              </Form.Group>

              <Row className="mb-2">
                <Col>
                  <Form.Group>
                    <Form.Label>Date de naissance</Form.Label>
                    <Form.Control
                      type="date"
                      name="birthDate"
                      value={values.birthDate}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      isInvalid={touched.birthDate && !!errors.birthDate}
                    />
                    <Form.Control.Feedback type="invalid">
                      {errors.birthDate}
                    </Form.Control.Feedback>
                  </Form.Group>
                </Col>
                <Col>
                  <Form.Group>
                    <Form.Label>CIN</Form.Label>
                    <Form.Control
                      name="cin"
                      type="number"
                      value={values.cin}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      isInvalid={touched.cin && !!errors.cin}
                    />
                    <Form.Control.Feedback type="invalid">
                      {errors.cin}
                    </Form.Control.Feedback>
                  </Form.Group>
                </Col>
              </Row>

              <Row className="mb-2">
                <Col>
                  <Form.Group>
                    <Form.Label>Nationalité</Form.Label>
                    <Form.Control
                      name="nationality"
                      value={values.nationality}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      isInvalid={
                        touched.nationality && !!errors.nationality
                      }
                    />
                    <Form.Control.Feedback type="invalid">
                      {errors.nationality}
                    </Form.Control.Feedback>
                  </Form.Group>
                </Col>
                <Col>
                  <Form.Group>
                    <Form.Label>Taille (cm)</Form.Label>
                    <Form.Control
                      name="height"
                      type="number"
                      value={values.height}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      isInvalid={touched.height && !!errors.height}
                    />
                    <Form.Control.Feedback type="invalid">
                      {errors.height}
                    </Form.Control.Feedback>
                  </Form.Group>
                </Col>
              </Row>

              {/* Pupitre (filtré selon le genre) */}
              <Form.Group className="mb-2">
                <Form.Label>Pupitre</Form.Label>
                <Select
                  name="pupitre"
                  options={
                    values.gender === "Homme"
                      ? [
                          { value: "ténor", label: "Ténor" },
                          { value: "basse", label: "Basse" },
                        ]
                      : values.gender === "Femme"
                      ? [
                          { value: "soprano", label: "Soprano" },
                          { value: "alto", label: "Alto" },
                        ]
                      : []
                  }
                  value={
                    values.gender === "Homme"
                      ? [
                          { value: "ténor", label: "Ténor" },
                          { value: "basse", label: "Basse" },
                        ].find((o) => o.value === values.pupitre)
                      : values.gender === "Femme"
                      ? [
                          { value: "soprano", label: "Soprano" },
                          { value: "alto", label: "Alto" },
                        ].find((o) => o.value === values.pupitre)
                      : null
                  }
                  onChange={(o) => setFieldValue("pupitre", o.value)}
                  onBlur={() =>
                    handleBlur({ target: { name: "pupitre" } })
                  }
                  className={touched.pupitre && errors.pupitre ? "is-invalid" : ""}
                />
                {touched.pupitre && errors.pupitre && (
                  <div className="invalid-feedback d-block">
                    {errors.pupitre}
                  </div>
                )}
              </Form.Group>

              <Row className="mb-2">
                <Col>
                  <Form.Group>
                    <Form.Check
                      type="checkbox"
                      label="Connaissance musicale"
                      name="hasMusicalKnowledge"
                      checked={values.hasMusicalKnowledge}
                      onChange={handleChange}
                    />
                  </Form.Group>
                </Col>
                <Col>
                  <Form.Group>
                    <Form.Check
                      type="checkbox"
                      label="Pratique instrumentale"
                      name="hasInstrumentalKnowledge"
                      checked={values.hasInstrumentalKnowledge}
                      onChange={handleChange}
                    />
                  </Form.Group>
                </Col>
              </Row>
            </>
          )}
        </Modal.Body>

        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Annuler
          </Button>
          <Button
            variant="primary"
            type="submit"
            disabled={isSubmitting || !isValid || (editingUser && !dirty)}
          >
            {editingUser ? "Mettre à jour" : "Créer"}
          </Button>
        </Modal.Footer>
      </Form>
    )}
  </Formik>
</Modal>

    </div>
  );
};

export default ManageAccounts;
