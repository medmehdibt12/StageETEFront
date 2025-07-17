/* eslint-disable prettier/prettier */
import { useLocation, useNavigate } from "react-router-dom";
import { ListGroup } from "react-bootstrap";
import { BASE_TITLE } from "../../../config/constant";

// 📌 Static path-title mapping
const titleMap = {
  "/dashboard": "Dashboard",
  "/admin/manage-accounts": "Gérer les Comptes",
  "/admin/manage-oeuvres": "Gérer les Œuvres",
  "/admin/manage-concerts": "Gérer les Concerts",
  "/admin/manage-rehearsals": "Gérer les Répétitions",
  "/admin/manage-eliminations": "Gérer les Éliminations",
  "/admin/final-participants": "Participants Finaux aux Concerts",
  "/admin/manage-membership": "Listes des candidats",
  // "/admin/manage-choriste": "Liste des Choristes",
  "/admin/manage-auditions": "Gérer les Auditions",
  "/user/profile": "Mon Profil",
  "/choriste/season-programme": "Programme de la Saison",
  "/choriste/repetitions": "Liste des Répétitions",
  "/choriste/concerts": "Disponibilité aux Concerts",
  "/choriste/declare-conge": "Déclarer un Congé",
  "/manager/manage-duty": "Liste Declaration des Congés",
  "/manager/modify-tessiture": "Modification des tessitures",
  "/chef/list-choriste": "Liste des Choristes",
  
  // "/program/season-programme": "Liste des Concerts",
  // 

  // Add other protected paths here
};

const Breadcrumb = () => {
  const { pathname } = useLocation();
  const navigate = useNavigate();

  // 🛑 Do not show breadcrumb on any /auth/* route
  if (pathname.startsWith("/auth")) return null;

  const title = titleMap[pathname] || "Dashboard";
  document.title = `${title}${BASE_TITLE}`;

  return (
    <div className="page-header">
      <div className="page-block">
        <div className="row align-items-center">
          <div className="col-md-12">
            <div className="page-header-title">
              <h5 className="m-b-10" style={{ fontWeight: "bold" }}>
                {title}
              </h5>
            </div>
            <ListGroup as="ul" bsPrefix=" " className="breadcrumb">
              <ListGroup.Item
                as="li"
                bsPrefix=" "
                className="breadcrumb-item"
                style={{ cursor: "pointer" }}
                onClick={() => navigate("/dashboard")}
              >
                <i className="feather icon-home" />
              </ListGroup.Item>
              <ListGroup.Item
                as="li"
                bsPrefix=" "
                className="breadcrumb-item active"
              >
                {title}
              </ListGroup.Item>
            </ListGroup>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Breadcrumb;
