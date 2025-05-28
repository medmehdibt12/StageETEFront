/* eslint-disable prettier/prettier */
import React, { useState } from "react";
import { Card, Row, Col, Image, Button, Badge } from "react-bootstrap";
import { useAuth } from "../../contexts/AuthContext";
import EditProfileModal from "./EditProfileModal";
import { BACKEND_URL } from "../../utils/axiosInstance";

const ProfilePage = () => {
  const { user } = useAuth();
  const [showModal, setShowModal] = useState(false);

  const isChoriste = user?.role === "choriste";
  const isManager = user?.role === "manager";
  const avatarUrl = user?.avatar
    ? `${BACKEND_URL}${user.avatar}`
    : "/default-avatar.jpg";

  return (
    <div className="d-flex justify-content-center align-items-start pt-5 pb-4 px-3">
      <Card
        className="shadow border-0 w-100"
        style={{ maxWidth: "700px", borderRadius: "20px" }}
      >
        <div
          className="text-white text-center py-4"
          style={{
            background: "linear-gradient(135deg, #00c6ff, #0072ff)",
            borderTopLeftRadius: "20px",
            borderTopRightRadius: "20px",
          }}
        >
          <Image
            src={avatarUrl}
            roundedCircle
            style={{
              width: "120px",
              height: "120px",
              objectFit: "cover",
              border: "4px solid white",
              boxShadow: "0 4px 10px rgba(0,0,0,0.2)",
            }}
          />
          <h4 className="mt-3 mb-0 fw-semibold text-capitalize text-dark">
            {user?.firstName} {user?.lastName}
          </h4>
          <Badge bg="light" text="dark" className="text-uppercase mt-2">
            {user?.role}
          </Badge>
        </div>

        <Card.Body className="px-4 py-4">
          <Row className="mb-3">
            <Col md={4} className="fw-semibold">
              📧 Email:
            </Col>
            <Col>{user?.email}</Col>
          </Row>

          {(isManager || isChoriste) && (
            <Row className="mb-3">
              <Col md={4} className="fw-semibold">
                📞 Téléphone:
              </Col>
              <Col>{user?.phone || "—"}</Col>
            </Row>
          )}

          {isChoriste && (
            <>
              <Row className="mb-3">
                <Col md={4} className="fw-semibold">
                  👤 Genre:
                </Col>
                <Col>{user?.gender || "—"}</Col>
              </Row>
              <Row className="mb-3">
                <Col md={4} className="fw-semibold">
                  🌍 Nationalité:
                </Col>
                <Col>{user?.nationality || "—"}</Col>
              </Row>
              <Row className="mb-3">
                <Col md={4} className="fw-semibold">
                  🎂 Date de naissance:
                </Col>
                <Col>
                  {user?.birthDate
                    ? new Date(user.birthDate).toLocaleDateString("fr-FR")
                    : "—"}
                </Col>
              </Row>
              <Row className="mb-3">
                <Col md={4} className="fw-semibold">
                  🎶 Pupitre:
                </Col>
                <Col>{user?.pupitre || "—"}</Col>
              </Row>
              <Row className="mb-3">
                <Col md={4} className="fw-semibold">
                  📌 Statut:
                </Col>
                <Col>{user?.status || "—"}</Col>
              </Row>
            </>
          )}

          <div className="text-end mt-3">
            <Button
              variant="info"
              onClick={() => setShowModal(true)}
              style={{ borderRadius: "12px", fontWeight: "500" }}
            >
              ✏️ Modifier le profil
            </Button>
          </div>
        </Card.Body>
      </Card>

      <EditProfileModal show={showModal} onHide={() => setShowModal(false)} />
    </div>
  );
};

export default ProfilePage;
